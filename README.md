<div align="center">
  <h1>CRUD</h1>
</div>
<div align="center">
  <strong>for RESTful APIs built with NestJs</strong>
</div>

<br />
We believe that everyone who's working with NestJs and building some RESTful services and especially some CRUD functionality will find `@n4it/crud` microframework very useful.

## Features
- :electric_plug: Super easy to install and start using the full-featured controllers and services :point_right:

- :octopus: DB and service agnostic extendable CRUD controllers

- :mag_right: Reach query parsing with filtering, pagination, sorting, relations, nested relations, cache, etc.

- :telescope: Framework agnostic package with query builder for a frontend usage

- :space_invader: Query, path params and DTOs validation included

- :clapper: Overriding controller methods with ease

- :wrench: Tiny config (including globally)

- :gift: Additional helper decorators

- :pencil2: Swagger documentation

## Install

yarn add @n4it/crud-typeorm

## Packages

- [**@n4it/crud**](https://www.npmjs.com/package/@n4it/crud) - core package which provides `@Crud()` decorator for endpoints generation, global configuration, validation, helper decorators ([docs](https://gid-oss.github.io/dataui-nestjs-crud/controllers/#description))
- [**@n4it/crud-request**](https://www.npmjs.com/package/@n4it/crud-request) - request builder/parser package which provides `RequestQueryBuilder` class for a frontend usage and `RequestQueryParser` that is being used internally for handling and validating query/path params on a backend side ([docs](https://gid-oss.github.io/dataui-nestjs-crud/requests/#frontend-usage))
- [**@n4it/crud-typeorm**](https://www.npmjs.com/package/@n4it/crud-typeorm) - TypeORM package which provides base `TypeOrmCrudService` with methods for CRUD database operations ([docs](https://gid-oss.github.io/dataui-nestjs-crud/service-typeorm/))

## Documentation

- :dart: [General Information](https://gid-oss.github.io/dataui-nestjs-crud/)
- :video_game: [CRUD Controllers](https://gid-oss.github.io/dataui-nestjs-crud/controllers/#description)
- :horse_racing: [CRUD ORM Services](https://gid-oss.github.io/dataui-nestjs-crud/services/)
- :trumpet: [Handling Requests](https://gid-oss.github.io/dataui-nestjs-crud/requests/#description)


## Contributors
This project exists thanks to all the people who contributed. Currently this project is fully maintained and actively further developed by N4IT.
