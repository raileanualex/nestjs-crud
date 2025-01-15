import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  CrudService,
  GetManyDefaultResponse,
} from '@n4it/crud';

import { EntityData, EntityManager, EntityRepository, FilterQuery, Populate } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common/exceptions';
import { ParsedRequestParams } from '@n4it/crud-request/interfaces';
import { ObjectLiteral } from '@n4it/crud-util';

export class MikroOrmCrudService<T extends object, DTO extends EntityData<T> = EntityData<T>> extends CrudService<T, EntityData<T>> {
  protected entityColumns: string[];
  protected entityPrimaryColumns: string[];
  protected entityName: string;
  protected entityColumnsHash: ObjectLiteral = {};

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

  async createOne(req: CrudRequest, dto: DTO): Promise<T> {
      const entity = this.repository.create(dto as any);
      await this.em.persistAndFlush(entity);

      return entity;
  }

  async createMany(req: CrudRequest, dto: CreateManyDto): Promise<T[]> {
      const entities = dto.bulk.map((item) => this.repository.create(item as any));
      await this.em.persistAndFlush(entities);

      return entities;
  }

  async updateOne(req: CrudRequest, dto: DTO): Promise<T> {
      const { parsed } = req;
      const filter = parsed.filter || {}; // Ensure filter is valid

      const entity = await this.repository.findOne(filter);

      if (!entity) {
          this.throwNotFoundException(this.entity.name);
      }

      Object.assign(entity, dto);
      await this.em.flush();
      return entity;
  }

  async replaceOne(req: CrudRequest, dto: DTO): Promise<T> {
      const { parsed } = req;
      const filter = parsed.filter || {}; // Ensure filter is valid

      const entity = await this.repository.findOne(filter);

      if (!entity) {
          this.throwNotFoundException(this.entity.name);
      }

      Object.keys(entity).forEach((key) => delete entity[key]);
      Object.assign(entity, dto);
      await this.em.flush();

      return entity;
  }

  async deleteOne(req: CrudRequest): Promise<void | T> {
      const { parsed } = req;
      const filter = parsed.filter || {}; // Ensure filter is valid

      const entity = await this.repository.findOne(filter);

      if (!entity) {
          this.throwNotFoundException(this.entity.name);
      }

      await this.em.removeAndFlush(entity);
  }

  async recoverOne(req: CrudRequest): Promise<void | T> {
      // MikroORM doesn't support soft deletes out of the box.
      // Implement logic here if soft deletes are enabled using a custom field like deletedAt.
      throw new BadRequestException('Recover not supported');
  }

  async findAll(): Promise<T[]> {
      return await this.repository.findAll();
  }

  transform(crudRequest: CrudRequest): any {
    
  

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

  public async createBuilder(
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
    many = true,
    withDeleted = false,
  ): Promise<{ filter: FilterQuery<T>; options: any }> {
    // Initialize the filter and options
    const filter: FilterQuery<T> = {};
    const queryOptions: any = {};
  
    // Get selected fields
    const select = this.getSelect(parsed, options.query);
    if (select && select.length) {
      queryOptions.fields = select;
    }
  
    // Add search conditions
    this.setSearchCondition(filter, parsed.search, options.operators?.custom);
  
    // Set joins (populate in MikroORM)
    const joinOptions = options.query?.join || {};
    const allowedJoins = Object.keys(joinOptions);
  
    if (allowedJoins.length > 0) {
      queryOptions.populate = queryOptions.populate || [];
      const eagerJoins: Record<string, boolean> = {};
  
      for (const join of allowedJoins) {
        if (joinOptions[join].eager) {
          queryOptions.populate.push(join as any);
          eagerJoins[join] = true;
        }
      }
  
      if (parsed.join?.length) {
        for (const join of parsed.join) {
          if (!eagerJoins[join.field] && allowedJoins.includes(join.field)) {
            queryOptions.populate.push(join.field as any);
          }
        }
      }
    }
  
    if (many) {
      // Set sort (order by)
      const sort = this.getSort(parsed, options.query) as QueryOrderMap;
      if (sort) {
        queryOptions.orderBy = sort;
      }
  
      // Set take (limit)
      const take = this.getTake(parsed, options.query);
      if (take && isFinite(take)) {
        queryOptions.limit = take;
      }
  
      // Set skip (offset)
      const skip = this.getSkip(parsed, take);
      if (skip && isFinite(skip)) {
        queryOptions.offset = skip;
      }
    }
  
    return { filter, options: queryOptions };
  }

}