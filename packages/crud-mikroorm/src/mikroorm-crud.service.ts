import {
  CreateManyDto,
  CrudRequest,
  CrudService,
  GetManyDefaultResponse,
} from '@n4it/crud';

import { EntityData, EntityManager, EntityRepository, Populate } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common/exceptions';

export class MikroOrmCrudService<T extends object, DTO extends EntityData<T> = EntityData<T>> extends CrudService<T, EntityData<T>> {
  constructor(
      private readonly em: EntityManager,
      private readonly entity: { new(): T },
  ) {
      super();
  }

  private get repository(): EntityRepository<T> {
      return this.em.getRepository(this.entity);
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
}