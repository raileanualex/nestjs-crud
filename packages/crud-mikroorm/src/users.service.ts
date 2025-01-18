import { Injectable } from '@nestjs/common';

import { EntityManager } from '@mikro-orm/core';
import { MikroOrmCrudService, User } from '.';

@Injectable()
export class UsersService extends MikroOrmCrudService<User> {
  constructor(private readonly entityManager: EntityManager) {
    super(entityManager, User, entityManager.getRepository(User));
  }
}

