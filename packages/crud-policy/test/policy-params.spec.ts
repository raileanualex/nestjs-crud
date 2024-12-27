import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { createNestMockServer } from './common';

jest.setTimeout(60000);

describe('#crud-policy', () => {
 
  describe('#top level manage default policies', () => {
    let app: INestApplication;
    let server: any;

    beforeAll(async () => {
      const nestMockServer = await createNestMockServer(["user:m"]);
      app = nestMockServer.app;
      server = nestMockServer.server;
    });

    afterAll(async () => {
      await app.close();
    });

    it('should be able to modify any user', async () => {
      const resp = await request(server)
        .post('/users')
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(201);

        await request(server)
          .put(`/users/${resp.body.id}`)
          .send({
            companyId: faker.number.int({ min: 1, max: 10 }),
            isActive: faker.datatype.boolean(),
            email: faker.internet.email(),
            name: {
              first: faker.person.firstName(),
              last: faker.person.lastName(),
            },
          }).expect(200);

        await request(server)
          .delete(`/users/${resp.body.id}`)
          .expect(200);
    });
  });

  describe('#top level write policies', () => {
    let app: INestApplication;
    let server: any;

    beforeAll(async () => {
      const nestMockServer = await createNestMockServer(["user:w"]);
      app = nestMockServer.app;
      server = nestMockServer.server;
    });

    afterAll(async () => {
      await app.close();
    });

    it('should be able to write any user', async () => {
      const resp = await request(server)
        .post('/users')
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(201);

      await request(server)
        .patch(`/users/${resp.body.id}`)
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(200);
    });

    it('should not be able to manage any user', async () => {
      const resp = await request(server)
        .post('/users')
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(201);

      await request(server)
        .put(`/users/${resp.body.id}`)
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(403);

      await request(server)
        .delete(`/users/${resp.body.id}`)
        .expect(403);
    });

    it('should be able to read any user', async () => {
      const resp = await request(server)
        .post('/users')
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(201);

      await request(server)
        .get(`/users/${resp.body.id}`)
        .expect(200);

      await request(server)
        .get('/users')
        .expect(200);
    });
  });

  describe('#top level read policies', () => {
    let app: INestApplication;
    let server: any;

    beforeAll(async () => {
      const nestMockServer = await createNestMockServer(["user:r"]);
      app = nestMockServer.app;
      server = nestMockServer.server;
    });

    afterAll(async () => {
      await app.close();
    });

    it('should not be able to write any user', async () => {
      const resp = await request(server)
        .post('/users')
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(403);

      await request(server)
        .patch(`/users/${resp.body.id}`)
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(403);
    });

    it('should not be able to manage any user', async () => {
      const resp = await request(server)
        .post('/users')
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(403);

      await request(server)
        .put(`/users/${resp.body.id}`)
        .send({
          companyId: faker.number.int({ min: 1, max: 10 }),
          isActive: faker.datatype.boolean(),
          email: faker.internet.email(),
          name: {
            first: faker.person.firstName(),
            last: faker.person.lastName(),
          },
        }).expect(403);

      await request(server)
        .delete(`/users/${resp.body.id}`)
        .expect(403);
    });

    it('should be able to read any user', async () => {
      await request(server)
        .get('/users')
        .expect(200);
    });
  });
});
