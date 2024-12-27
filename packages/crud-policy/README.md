<div align="center">
  <h1>CRUD (@n4it/crud)</h1>
</div>
<div align="center">
  <strong>for RESTful APIs built with NestJs</strong>
</div>
<br/>
<div align="center">
  <img src="https://gravatar.com/avatar/c27e8ebbf92f687180aa0f13dab9a0b1?size=256" alt="Logo n4it" style="border-radius:100%"/>
</div>

<br />

<div align="center">
  <a href="https://github.com/nest4it/nestjs-crud/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/nest4it/nestjs-crud.svg" alt="License" />
  </a>
  <a href="https://www.npmjs.com/package/@n4it/crud">
    <img src="https://img.shields.io/npm/v/@n4it/crud.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/org/n4it">
    <img src="https://img.shields.io/npm/dm/@n4it/crud.svg" alt="npm downloads" />
  </a>
  <a href="https://renovatebot.com/">
    <img src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg" alt="Renovate" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs welcome" />
  </a>
</div>

<div align="center">
  <sub>Built by
  <a href="https://twitter.com/MichaelYali">@MichaelYali</a> and
  <a href="https://n4it.nl">n4it</a> and
  <a href="https://github.com/nest4it/nestjs-crud/graphs/contributors">
    Contributors
  </a>
</div>

<br />

We believe that everyone who's working with NestJs and building some RESTful services and especially some CRUD functionality will find `@n4it/crud` microframework very useful.

## Features

<img align="right" src="https://raw.githubusercontent.com/gid-oss/dataui-nestjs-crud/master/img/crud-usage2.png" alt="CRUD usage" />

- Super easy to install and start using the full-featured controllers and services :point_right:

- DB and service agnostic extendable CRUD controllers

- Reach query parsing with filtering, pagination, sorting, relations, nested relations, cache, etc.

- Framework agnostic package with query builder for a frontend usage

- Query, path params and DTOs validation included

- Overriding controller methods with ease

- Tiny config (including globally)

- Additional helper decorators

- Swagger documentation

## Install

```shell
npm i @n4it/crud class-transformer class-validator
```

## Packages

- [**@n4it/crud**](https://www.npmjs.com/package/@n4it/crud) - core package which provides `@Crud()` decorator for endpoints generation, global configuration, validation, helper decorators ([docs](https://gid-oss.github.io/dataui-nestjs-crud/controllers/#description))
- [**@n4it/crud-request**](https://www.npmjs.com/package/@n4it/crud-request) - request builder/parser package which provides `RequestQueryBuilder` class for a frontend usage and `RequestQueryParser` that is being used internally for handling and validating query/path params on a backend side ([docs](https://gid-oss.github.io/dataui-nestjs-crud/requests/#frontend-usage))
- [**@n4it/crud-typeorm**](https://www.npmjs.com/package/@n4it/crud-typeorm) - TypeORM package which provides base `TypeOrmCrudService` with methods for CRUD database operations ([docs](https://gid-oss.github.io/dataui-nestjs-crud/service-typeorm/))

## Documentation

- [General Information](https://gid-oss.github.io/dataui-nestjs-crud/)
- [CRUD Controllers](https://gid-oss.github.io/dataui-nestjs-crud/controllers/#description)
- [CRUD ORM Services](https://gid-oss.github.io/dataui-nestjs-crud/services/)
- [Handling Requests](https://gid-oss.github.io/dataui-nestjs-crud/requests/#description)

## Support

Any support is welcome. At least you can give us a star.

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].

### Financial Contributors

#### Organizations

Currently this project is sponsored and maintained by N4IT. Get in touch if you want to become a sponsor.

## License

[GPL-3.0](LICENSE)