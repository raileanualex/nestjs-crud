import { Injectable } from '@nestjs/common';

import { EntityManager } from '@mikro-orm/core';
import { Users } from './user-mikroorm.entity';
import { MikroOrmCrudService } from '../src/mikroorm-crud.service';

@Injectable()
export class UsersService extends MikroOrmCrudService<Users> {
  constructor(private readonly entityManager: EntityManager) {
    super(entityManager.getRepository(Users));
  }
}
