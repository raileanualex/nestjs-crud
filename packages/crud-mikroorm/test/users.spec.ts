import { Test, TestingModule } from '@nestjs/testing';
import { EntityCaseNamingStrategy, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Crud, CrudRequest } from '@n4it/crud';
import { Controller, Get, INestApplication, Param, Query } from '@nestjs/common';
import { RequestQueryBuilder } from '@n4it/crud-request';
import * as request from 'supertest';
import { UsersService } from './__fixtures__/users.service';
import { User } from './__fixtures__/user.entity';

jest.setTimeout(60000);

describe('UsersService', () => {
  let orm: any;
  let app: INestApplication;
  let server: any;
  let qb: RequestQueryBuilder;
  let service: UsersService;

  @Crud({
    model: { type: User },
    query: {
      alwaysPaginate: true,
      limit: 3,
    },
  })
  @Controller('users0')
  class UsersController0 {
    constructor(public service: UsersService) {}
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          entities: [User], // Your entity
          dbName: 'nestjsx_crud', // Replace with your local database name
          user: 'root', // Replace with your PostgreSQL username
          password: 'root', // Replace with your PostgreSQL password
          port: 5432, // Default PostgreSQL port
          host: 'localhost', // Assuming your database is local
          debug: true, // Optional: Enable SQL query logging
          driver: PostgreSqlDriver,
          namingStrategy: EntityCaseNamingStrategy,
          allowGlobalContext: true,
        }),
        MikroOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
      controllers: [UsersController0],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    app = module.createNestApplication();
    service = app.get<UsersService>(UsersService);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => {
    qb = RequestQueryBuilder.create();
  });

  // This will work only if you have the same number in database
  // it('should return an array of all entities', async () => {
  //   const res = await request(server).get('/users0');
    
  //   expect(res.status).toBe(200);
  //   expect(res.body.length).toBe(6);
  // });

  // it('should return an array of the entity with nameFirst=alex', async () => {
  //   const query = qb.search({ 'nameFirst': { $eq: "alex" } }).query();
       
  //   const res = await request(server).get('/users0').query(query);
    
  //   expect(res.status).toBe(200);
  //   expect(res.body.length).toBe(1);
  // });

  it('should return user name after createOne', async () => {
    const user = await service.createOne(undefined, {
      nameFirst: "alex",
      nameLast: "raileanu"
    });

    expect(user.nameFirst).toEqual("alex");
    expect(user.nameLast).toEqual("raileanu");
  });

  it('should return the id of the first user after findAll', async () => {
    const users = await service.findAll();

    expect(users[0].id).toEqual(1);
  });
});