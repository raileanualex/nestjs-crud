import { Test, TestingModule } from '@nestjs/testing';
import { EntityCaseNamingStrategy, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from '../src';
import { UsersService } from '../src';

jest.setTimeout(60000);

describe('UserService', () => {
  let usersService: UsersService;
  let orm: any;

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
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    const em = orm.em.fork();
    usersService = new UsersService(em);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('should return user name when it is created', async () => {
    const user = await usersService.createOne(undefined, {
      nameFirst: "alex",
      nameLast: "raileanu",
      companyId: 1,
      email: "test@alex.com",
    });

    expect(user.nameFirst).toEqual("alex");
    expect(user.nameLast).toEqual("raileanu");
  });

  it('should return an empty list when no users exist', async () => {
    const users = await usersService.findAll();

    expect(users[0].id).toEqual(1);
  });
});