import {
  CreateManyDto,
  CrudRequest,
  CrudService,
  GetManyDefaultResponse,
  QueryOptions,
} from '@n4it/crud';

import { DeepPartial, EntityData, EntityManager, EntityMetadata, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common/exceptions';
import { hasLength, isArrayFull, isNil, isObject, isUndefined, ObjectLiteral, objKeys } from '@n4it/crud-util';
import { plainToClass } from 'class-transformer';

export class MikroOrmCrudService<T extends object, DTO extends EntityData<T> = EntityData<T>> extends CrudService<T, EntityData<T>> {
  protected entityColumns: string[];
  protected entityPrimaryColumns: string[];
  protected entityName: string;
  protected entityColumnsHash: ObjectLiteral = {};
  protected entityHasDeleteColumn: boolean = false;
  protected dbName: string;
  protected sqlInjectionRegEx: RegExp[] = [
    /(%27)|(\')|(--)|(%23)|(#)/gi,
    /((%3D)|(=))[^\n]*((%27)|(\')|(--)|(%3B)|(;))/gi,
    /w*((%27)|(\'))((%6F)|o|(%4F))((%72)|r|(%52))/gi,
    /((%27)|(\'))union/gi,
  ];

  constructor(
    private readonly em: EntityManager,
    private readonly entity: { new(): T },
    private readonly repository: EntityRepository<T>,
  ) {
    super();
    this.entityName = entity.name;
    this.onInitMapEntityColumns();
  }

  public get findOne() {
    return this.repository.findOne.bind(this.repository);
  }

  public get findOneOrFail() {
    return this.repository.findOneOrFail.bind(this.repository);
  }

  public get find() {
    return this.repository.find.bind(this.repository);
  }

  public get count() {
    return this.repository.count.bind(this.repository);
  }

  protected get entityType(): { new(): T } {
    return this.entity;
  }

  protected get alias(): string {
    return this.em.getMetadata().get(this.entityName).name;
  }

  protected onInitMapEntityColumns() {
    const metadata = this.em.getMetadata().get(this.entityName);

    this.entityColumns = Object.values(metadata.properties).map((prop) => {
      // Check if the property is embedded
      if (prop.embedded) {
        this.entityColumnsHash[prop.name] = prop.name; // Use the full path for embedded properties
        return prop.name;
      }
      this.entityColumnsHash[prop.name] = prop.name; // Regular properties
      return prop.name;
    });

    // Identify primary columns
    this.entityPrimaryColumns = Object.values(metadata.properties)
      .filter((prop) => prop.primary) // Check if the property is a primary key
      .map((prop) => prop.name);
  }

  validateFields(fields: string[]) {
    for(const field of fields) {
      if (this.entityColumnsHash[field] !== field) {
        this.throwBadRequestException(`Invalid field: ${field}`)
      }
    }
  }

  validateFilterFields(filter){
    Object.keys(filter).forEach(field => {
      if (this.entityColumnsHash[field] !== field) {
        this.throwBadRequestException(`Invalid field: ${field}`)
      }
    })
  }

  async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    this.validateSqlInjectionFields(req);

    const { parsed, options } = req;
    const take = this.getTake(parsed, options.query);
    const skip = this.getSkip(parsed, take || 0);
    const filter = this.transformParsedToMikro(parsed);
    this.validateFilterFields(filter);

    let queryOptions = this.transformOptionsToMikro(options);

    const populate = parsed.join.map(option => option.field);
    
    if (populate) {
      this.validateFields(parsed.fields);
      queryOptions = {
        ...queryOptions,
        populate: populate as any,
      }
    }

    if (parsed.fields.length > 0) {
      this.validateFields(parsed.fields);

      queryOptions = {
        ...queryOptions,
        fields: parsed.fields as any,
      }
    }

    const [data, total] = await this.repository.findAndCount(filter, {
      ...queryOptions,
      offset: skip || 0,
      limit: take || undefined,
      orderBy: this.transformSort(parsed.sort) || undefined,
    });

    if (this.decidePagination(parsed, options)) {
      return this.createPageInfo(data, total, take || total, skip || 0);
    }

    return data;
  }

  async getOne(req: CrudRequest): Promise<T> {
    this.validateSqlInjectionFields(req);
    return await this.getOneOrFail(req);
  }

  async createOne(req: CrudRequest, dto: DeepPartial<T>): Promise<T> {
    this.validateSqlInjectionFields(req);
    const returnShallow = req?.options?.routes?.createOneBase.returnShallow || true;
    const entity = this.prepareEntityBeforeSave(dto, req?.parsed);

    if (!entity) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    const savedEntity = this.repository.create(entity);

    await this.em.persistAndFlush(savedEntity);

    if (returnShallow) {
      return savedEntity;
    }
    const primaryParams = this.getPrimaryParams(req.options);

    if (!primaryParams.length && primaryParams.some((p) => isNil(savedEntity[p]))) {
      return savedEntity;
    } else {
      req.parsed.search = primaryParams.reduce(
        (acc, p) => ({ ...acc, [p]: savedEntity[p] }),
        {},
      );
      return this.getOneOrFail(req);
    }
  }

  async createMany(req: CrudRequest, dto: CreateManyDto<DeepPartial<T>>): Promise<T[]> {
    this.validateSqlInjectionFields(req);
    if (!isObject(dto) || !isArrayFull(dto.bulk)) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    const bulk = dto.bulk
      .map((one) => this.prepareEntityBeforeSave(one, req.parsed))
      .filter((d) => !isUndefined(d));

    if (!hasLength(bulk)) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    await this.em.persistAndFlush(bulk);

    return bulk;
  }

  async updateOne(req: CrudRequest, dto: DTO): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.updateOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);

    // Disable cache while updating
    req.options.query.cache = false;

    // Fetch the entity
    const found = await this.getOneOrFail(req, returnShallow);

    // Merge the dto with existing entity data
    const toSave = !allowParamsOverride
      ? { ...found, ...dto, ...paramsFilters, ...req.parsed.authPersist }
      : { ...found, ...dto, ...req.parsed.authPersist };

    // Prepare entity for saving (this can be skipped if the DTO is already an entity)
    const entityToUpdate = plainToClass(this.entity, toSave, req.parsed.classTransformOptions);

    // Save the entity (persist and flush in MikroORM)
    await this.em.persistAndFlush(entityToUpdate);

    if (returnShallow) {
      return entityToUpdate;
    }

    req.parsed.paramsFilter.forEach((filter) => {
      filter.value = entityToUpdate[filter.field];
    });

    return this.getOneOrFail(req);
  }
  
  protected transformSort(sortFields: any[]) {
    return sortFields.reduce((acc, sortField) => {
      acc[sortField.field] = sortField.order; 
      return acc;
    }, {}); 
  }

  protected applyCondition(field: string, operator: string, value: string) {
    switch (operator) {
      case "$eq":
        return { [field]: value }; // Equals
      case "$ne":
        return { [field]: { $ne: value } }; // Not equals
      case "$lt":
        return { [field]: { $lt: value } }; // Less than
      case "$lte":
        return { [field]: { $lte: value } }; // Less than or equal
      case "$gt":
        return { [field]: { $gt: value } }; // Greater than
      case "$gte":
        return { [field]: { $gte: value } }; // Greater than or equal
      case "$starts":
        return { [field]: { $like: `${value}%` } }; // Starts with
      case "$ends":
        return { [field]: { $like: `%${value}` } }; // Ends with
      case "$cont":
        return { [field]: { $like: `%${value}%` } }; // Contains
      case "$excl":
        return { [field]: { $notLike: `%${value}%` } }; // Not contains
      case "$in":
        return { [field]: { $in: value } }; // In array
      case "$notin":
        return { [field]: { $nin: value } }; // Not in array
      case "$isnull":
        return { [field]: { $eq: null } }; // Is null
      case "$notnull":
        return { [field]: { $ne: null } }; // Is not null
      case "$between":
        if (Array.isArray(value) && value.length === 2) {
          return { [field]: { $gte: value[0], $lte: value[1] } }; // Range
        }
        break;
      case "$eqL":
        return { [`LOWER(${field})`]: value.toLowerCase() }; // Case insensitive equals
      case "$neL":
        return { [`LOWER(${field})`]: { $ne: value.toLowerCase() } }; // Case insensitive not equals
      case "$startsL":
        return { [`LOWER(${field})`]: { $like: `${value.toLowerCase()}%` } }; // Case insensitive starts with
      case "$endsL":
        return { [`LOWER(${field})`]: { $like: `%${value.toLowerCase()}` } }; // Case insensitive ends with
      case "$contL":
        return { [`LOWER(${field})`]: { $like: `%${value.toLowerCase()}%` } }; // Case insensitive contains
      case "$exclL":
        return { [`LOWER(${field})`]: { $notLike: `%${value.toLowerCase()}%` } }; // Case insensitive not contains
      case "$contArr":
        return { [field]: { $contains: value } };
      case "$intersectsArr":
        return { [field]: { $overlap: value } };
      default:
        throw new Error(`Operator(${operator}) is not supported!`)
        return {};
    }
  };

  protected transformParsedToMikro(parsed) {
    const whereConditions: any = {};
    // Handle paramsFilter and apply operators
    parsed.paramsFilter.forEach((filter) => {
      const { field, operator, value } = filter;
      const condition = this.applyCondition(field, operator, value);
     
      Object.assign(whereConditions, condition);
    });
  
    // Handle search condition ($and)
    if (parsed.search && parsed.search?.$and) {
      parsed.search.$and.forEach((condition) => {
        //todo: handle recursive.
        if (condition) {
          Object.assign(whereConditions, condition);
        }
      });
    }
  
    // Handle or condition ($or)
    if (parsed.search && parsed.search?.$or?.length > 0) {
      whereConditions.$or = parsed.search.$or.map((condition) => {
        const response = this.applyCondition(condition.field, condition.operator, condition.value)
        return response;
      });
    }

    return whereConditions;
  }

  
  protected transformOptionsToMikro(options) {
      const mikroOptions: any = {};
    
      // Handle pagination settings
      if (options?.query && options?.query?.alwaysPaginate) {
        mikroOptions.limit = options.query.limit || 10; 
        mikroOptions.offset = options.query.offset || 0;
      }
    
      // Handle sorting options
      if (options.query && options.query.sort) {
        mikroOptions.orderBy = options.query.sort.map((sortField) => {
          return {
            [sortField.field]: sortField.direction || 'ASC'
          };
        });
      }
    
      if (options.query && options.query.select) {
        mikroOptions.select = options.query.select;
      }
    
      if (options.routes) {
        mikroOptions.routes = options.routes;
      }
    
      if (options.routes && options.routes.createOneBase && options.routes.createOneBase.returnShallow !== undefined) {
        mikroOptions.returnShallow = options.routes.createOneBase.returnShallow;
      }
    
      return mikroOptions;
  }
  
  protected async getOneOrFail(
    req: CrudRequest,
    withDeleted = false,
  ): Promise<T> {
    const { parsed, options } = req;

    const filter: FilterQuery<T> = this.transformParsedToMikro(parsed);
    let queryOptions: any = this.transformOptionsToMikro(options);
    if (parsed.fields?.length > 0) {
      queryOptions = {
        ...queryOptions,
        fields: parsed.fields as any
      }
    };

    const found = await this.repository.findOne(filter, queryOptions);

    if (!found) {
      this.throwNotFoundException(this.alias);
    }

    return found;
  }

  async replaceOne(req: CrudRequest, dto: DTO): Promise<T> {
    this.validateSqlInjectionFields(req);
    const { allowParamsOverride, returnShallow } = req.options.routes.replaceOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);

    // Disable cache while replacing
    req.options.query.cache = false;

    // Fetch the entity, return null if not found
    const found = await this.getOneOrFail(req, returnShallow).catch(() => null);

    // Merge the entity with dto and filters
    const toSave = !allowParamsOverride
      ? { ...(found || {}), ...dto, ...paramsFilters, ...req.parsed.authPersist }
      : { ...(found || {}), ...paramsFilters, ...dto, ...req.parsed.authPersist };

    // Prepare entity for saving (this can be skipped if the DTO is already an entity)
    const entityToSave = plainToClass(this.entity, toSave, req.parsed.classTransformOptions);

    await this.em.persistAndFlush(entityToSave);

    if (returnShallow) {
      return entityToSave;
    } else {
      // Get primary params from the request options
      const primaryParams = this.getPrimaryParams(req.options);

      // If no primary params, return replaced entity
      if (!primaryParams.length) {
        return entityToSave;
      }

      // Set search params from replaced entity
      req.parsed.search = primaryParams.reduce(
        (acc, p) => ({ ...acc, [p]: entityToSave[p] }),
        {},
      );

      // Return the entity after applying the search filter
      return this.getOneOrFail(req);
    }
  }

  async deleteOne(req: CrudRequest): Promise<void | T> {
    this.validateSqlInjectionFields(req);

    const { returnDeleted } = req.options.routes.deleteOneBase;
    req.options.query.cache = false;

    const found = await this.getOneOrFail(req, returnDeleted);
    const toReturn = returnDeleted
      ? plainToClass(this.entityType, { ...found }, req.parsed.classTransformOptions)
      : undefined;

    await this.repository.nativeDelete(found);

    return toReturn;
  }

  async findAll(): Promise<T[]> {
    return await this.repository.findAll();
  }

  public getParamFilters(parsed: CrudRequest['parsed']): ObjectLiteral {
    const filters = {};

    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        filters[filter.field] = filter.value;
      }
    }

    return filters;
  }
  protected getEntityColumns(entityMetadata: EntityMetadata): { columns: string[]; primaryColumns: string[] } {
    const columns = Object.keys(entityMetadata.properties); // all properties (columns) of the entity
    const primaryColumns = entityMetadata.primaryKeys; // primary key columns are directly stored as strings

    return { columns, primaryColumns };
  }

  protected getAllowedColumns(columns: string[], options: QueryOptions): string[] {
    return (!options.exclude || !options.exclude.length) &&
      (!options.allow || !options.allow.length)
      ? columns
      : columns.filter(
        (column) =>
          (options.exclude && options.exclude.length
            ? !options.exclude.some((col) => col === column)
            : true) &&
          (options.allow && options.allow.length
            ? options.allow.some((col) => col === column)
            : true),
      );
  }

  protected prepareEntityBeforeSave(
    dto: DeepPartial<T>,
    parsed: CrudRequest['parsed']
  ): T | undefined {
    if (!parsed) {
      return dto;
    }

    // Check if dto is an object
    if (!isObject(dto)) {
      return undefined;
    }

    // Apply parameters filter to dto fields
    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        dto[filter.field] = filter.value;
      }
    }

    // Ensure dto is not empty before proceeding
    if (!hasLength(objKeys(dto))) {
      return undefined;
    }

    // If dto is an instance of the entity type, apply authPersist directly
    if (dto instanceof this.entity) {
      return Object.assign(dto, parsed.authPersist);
    }

    // Transform plain DTO into an entity if it's not an instance of the entity type
    const entityInstance = plainToClass(this.entity, { ...dto, ...parsed.authPersist }, parsed.classTransformOptions);

    return entityInstance;
  }


  protected checkSqlInjection(field: string) {
    if (this.sqlInjectionRegEx.length) {
      for (let i = 0; i < this.sqlInjectionRegEx.length; i++) {
        if (this.sqlInjectionRegEx[i].test(field)) {
          this.throwBadRequestException(`SQL injection detected: "${field}"`);
        }
      }
    }
  }

  protected validateSqlInjectionFields(crudRequest: CrudRequest) {
    this.checkSqlInjection(JSON.stringify(crudRequest.parsed));
    this.checkSqlInjection(JSON.stringify(crudRequest.options));
  }
}