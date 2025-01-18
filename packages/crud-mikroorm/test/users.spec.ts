import { Test, TestingModule } from '@nestjs/testing';
import { EntityCaseNamingStrategy, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from '../src';
import { UsersService } from '../src';
import { Crud } from '@n4it/crud';
import { Controller, INestApplication } from '@nestjs/common';
import { RequestQueryBuilder } from '@n4it/crud-request';
import * as request from 'supertest';

jest.setTimeout(60000);

describe('UserService', () => {
  let usersService: UsersService;
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
          namingStrategy: EntityCaseNamingStrategy
        }),
        MikroOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
      controllers: [UsersController0],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    const em = orm.em.fork();
    usersService = new UsersService(em);

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

  it('should return an array of all entities', async () => {
    const res = await request(server).get('/users0');
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  // it('should return user name after createOne', async () => {
  //   const user = await service.createOne(undefined, {
  //     nameFirst: "alex",
  //     nameLast: "raileanu",
  //     companyId: 1,
  //     email: "test@alex.com",
  //   });

  //   expect(user.nameFirst).toEqual("alex");
  //   expect(user.nameLast).toEqual("raileanu");
  // });

  // it('should return the id of the first user after findAll', async () => {
  //   const users = await service.findAll();

  //   expect(users[0].id).toEqual(1);
  // });
});