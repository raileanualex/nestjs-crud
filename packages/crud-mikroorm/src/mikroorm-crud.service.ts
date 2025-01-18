import {
  CreateManyDto,
  CrudRequest,
  CrudService,
  GetManyDefaultResponse,
  QueryOptions,
} from '@n4it/crud';

import { ColumnType, DeepPartial, EntityData, EntityManager, EntityMetadata, EntityRepository, Populate } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common/exceptions';
import { ParsedRequestParams } from '@n4it/crud-request/interfaces';
import { hasLength, isArrayFull, isNil, isObject, isUndefined, ObjectLiteral, objKeys } from '@n4it/crud-util';
import { plainToClass } from 'class-transformer';
import { QueryFilter } from '@n4it/crud-request/types';

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
  ) {
      super();
      this.entityName = entity.name;
      this.onInitMapEntityColumns();
  }


  private get repository(): EntityRepository<T> {
      return this.em.getRepository(this.entity);
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
  
  protected get entityType(): { new (): T } {
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
  

  async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    // TODO: adjust queries
      const { parsed, options } = req;
      const take = this.getTake(parsed, options.query);
      const skip = this.getSkip(parsed, take || 0);
      const filter = parsed.filter || {};

      const [data, total] = await this.repository.findAndCount(filter, {
          offset: skip || 0,
          limit: take || undefined,
          orderBy: parsed.sort || undefined,
      });

      if (this.decidePagination(parsed, options)) {
          return this.createPageInfo(data, total, take || total, skip || 0);
      }

      return data;
  }


  async getOne(req: CrudRequest): Promise<T> {
      // TODO: adjust queries
      const { parsed } = req;

      // Ensure the filter is valid
      const filter = parsed.filter || {};

      // Retrieve entity metadata
      const entityMeta = this.em.getMetadata().find(this.entity.name);
      const validFields = entityMeta?.relations.map((rel) => rel.name) || [];

      // Transform and validate populate
      const populate = parsed.join
          ?.map((join) => join.field)
          .filter((field) => validFields.includes(field)) as unknown as Populate<T, string> | undefined;


      // Query the database
      const entity = await this.repository.findOne(filter, { populate });

      if (!entity) {
          this.throwNotFoundException(this.entity.name);
      }

      return entity;
  }

  async createOne(req: CrudRequest, dto: DeepPartial<T>): Promise<T> {
      const { returnShallow } = req.options.routes.createOneBase;
      const entity = this.prepareEntityBeforeSave(dto, req.parsed);
      
      if (!entity) {
        this.throwBadRequestException(`Empty data. Nothing to save.`);
      }

      const savedEntity = this.repository.create(entity);

      await this.em.persistAndFlush(savedEntity);

      if (returnShallow) {
        return savedEntity;
      }
      const primaryParams = this.getPrimaryParams(req.options);

      /* istanbul ignore next */
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


  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    // TODO
    return;
  }


  async replaceOne(req: CrudRequest, dto: DTO): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.replaceOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);

    // Disable cache while replacing
    req.options.query.cache = false;

    // Fetch the entity, return null if not found
    const found = await this.getOneOrFail(req, returnShallow).catch(() => null);

    // Merge the entity with dto and filters
    const toSave = !allowParamsOverride
      ? { ...(found || {}), ...dto, ...paramsFilters, ...req.parsed.authPersist }
      : { ...(found || /* istanbul ignore next */ {}), ...paramsFilters, ...dto, ...req.parsed.authPersist };

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
    const { returnDeleted } = req.options.routes.deleteOneBase;
    req.options.query.cache = false;

    const found = await this.getOneOrFail(req, returnDeleted);
    const toReturn = returnDeleted
      ? plainToClass(this.entityType, { ...found }, req.parsed.classTransformOptions)
      : undefined;

      
    if (req.options.query.softDelete === true) {
      // TODO: if we want soft delete, it must be implemented manually
      // therefore T needs to extend a BaseEntity with deletedAt & id.
      // await this.repository.nativeUpdate({ id: toReturn['id'] as any }, { deletedAt: new Date() });
    } else {
      await this.repository.nativeDelete(found);
    }

    return toReturn;
  }

  async recoverOne(req: CrudRequest): Promise<void | T> {
      // MikroORM doesn't support soft deletes out of the box.
      // Implement logic here if soft deletes are enabled using a custom field like deletedAt.
      throw new BadRequestException('Recover not supported');
  }

  async findAll(): Promise<T[]> {
      return await this.repository.findAll();
  }

  public getParamFilters(parsed: CrudRequest['parsed']): ObjectLiteral {
    const filters = {};

    /* istanbul ignore else */
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
      (!options.allow || /* istanbul ignore next */ !options.allow.length)
      ? columns
      : columns.filter(
          (column) =>
            (options.exclude && options.exclude.length
              ? !options.exclude.some((col) => col === column)
              : /* istanbul ignore next */ true) &&
            (options.allow && options.allow.length
              ? options.allow.some((col) => col === column)
              : /* istanbul ignore next */ true),
        );
  }

  protected getSelect(query: ParsedRequestParams, options: QueryOptions): string[] {
    const allowed = this.getAllowedColumns(this.entityColumns, options);

    const columns =
      query.fields && query.fields.length
        ? query.fields.filter((field) => allowed.some((col) => field === col))
        : allowed;

    const select = [
      ...new Set([
        ...(options.persist && options.persist.length ? options.persist : []),
        ...columns,
        ...this.entityPrimaryColumns,
      ]),
    ].map((col) => `${this.alias}.${col}`);

    return Array.from(new Set(select));
  }

  // public async createBuilder(
  //   parsed: ParsedRequestParams,
  //   options: CrudRequestOptions,
  //   many = true,
  //   withDeleted = false,
  // ): Promise<{ filter: FilterQuery<T>; options: any }> {
  //   // Initialize the filter and options
  //   const filter: FilterQuery<T> = {};
  //   const queryOptions: any = {};
  
  //   // Get selected fields
  //   const select = this.getSelect(parsed, options.query);
  //   if (select && select.length) {
  //     queryOptions.fields = select;
  //   }
  
  //   // Add search conditions
  //   this.setSearchCondition(filter, parsed.search, options.operators?.custom);
  
  //   // Set joins (populate in MikroORM)
  //   const joinOptions = options.query?.join || {};
  //   const allowedJoins = Object.keys(joinOptions);
  
  //   if (allowedJoins.length > 0) {
  //     queryOptions.populate = queryOptions.populate || [];
  //     const eagerJoins: Record<string, boolean> = {};
  
  //     for (const join of allowedJoins) {
  //       if (joinOptions[join].eager) {
  //         queryOptions.populate.push(join as any);
  //         eagerJoins[join] = true;
  //       }
  //     }
  
  //     if (parsed.join?.length) {
  //       for (const join of parsed.join) {
  //         if (!eagerJoins[join.field] && allowedJoins.includes(join.field)) {
  //           queryOptions.populate.push(join.field as any);
  //         }
  //       }
  //     }
  //   }
  
  //   if (many) {
  //     // Set sort (order by)
  //     const sort = this.getSort(parsed, options.query) as QueryOrderMap;
  //     if (sort) {
  //       queryOptions.orderBy = sort;
  //     }
  
  //     // Set take (limit)
  //     const take = this.getTake(parsed, options.query);
  //     if (take && isFinite(take)) {
  //       queryOptions.limit = take;
  //     }
  
  //     // Set skip (offset)
  //     const skip = this.getSkip(parsed, take);
  //     if (skip && isFinite(skip)) {
  //       queryOptions.offset = skip;
  //     }
  //   }
  
  //   return { filter, options: queryOptions };
  // }

  protected prepareEntityBeforeSave(
    dto: DeepPartial<T>,
    parsed: CrudRequest['parsed']
  ): T | undefined {
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


  protected checkFilterIsArray(cond: QueryFilter, withLength?: boolean) {
    /* istanbul ignore if */
    if (
      !Array.isArray(cond.value) ||
      !cond.value.length ||
      (!isNil(withLength) ? withLength : false)
    ) {
      this.throwBadRequestException(`Invalid column '${cond.field}' value`);
    }
  }


  protected checkSqlInjection(field: string): string {
    /* istanbul ignore else */
    if (this.sqlInjectionRegEx.length) {
      for (let i = 0; i < this.sqlInjectionRegEx.length; i++) {
        /* istanbul ignore else */
        if (this.sqlInjectionRegEx[i].test(field)) {
          this.throwBadRequestException(`SQL injection detected: "${field}"`);
        }
      }
    }

    return field;
  }
  protected getColumnType(field: string): ColumnType | undefined {
      // Get the EntityMetadata for the repository's entity
      const metadata = this.em.getMetadata(this.entityName);
    
      // Find the column by its property name in metadata.props
      const column = metadata.props[field];
    
      // Return the column type or undefined if not found
      return column?.type;
  }
}