import { Type } from '@nestjs/common';
import { OmitType } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import type { DtoOptions } from '../interfaces';

// this function is a hack to create a unique class name
// this is needed because NestJS uses class prototype to store metadata
// and if we use the same base class in multiple places, the metadata will be overwritten
export const createUniqueClassWithDefaults = <T>(cls: Type<T>, defaults: Partial<T>) => {
  const uniqueClassName = `${cls.name}_${randomUUID().replace(/-/g, '_')}`;
  const defaultEntries = Object.entries(defaults);

  return new Function(
    'cls',
    'defaults',
    `
    return class ${uniqueClassName} extends cls {
      constructor(...args) {
        super(...args);
        defaults.forEach(([key, value]) => {
          this[key] = value;
        });
      }
    };
  `,
  )(cls, defaultEntries);
};

export type DtoDecorator<T> = {
  keysToOmitOnCreate: readonly (keyof T)[];
  keysToOmitOnUpdate: readonly (keyof T)[];
  defaults: Partial<T>;
};

export const createCrudDtoDecorators = <T>(
  classRef: Type<T>,
  opts: Partial<DtoDecorator<T>>,
): DtoOptions => {
  const keysToOmitOnCreate = opts.keysToOmitOnCreate ?? [];
  const keysToOmitOnUpdate = opts.keysToOmitOnUpdate ?? [];
  const defaults = opts.defaults ?? {};

  return {
    create: createUniqueClassWithDefaults(
      OmitType(classRef, keysToOmitOnCreate),
      defaults,
    ),
    update: createUniqueClassWithDefaults(
      OmitType(classRef, [...keysToOmitOnCreate, ...keysToOmitOnUpdate]),
      defaults,
    ),
    replace: createUniqueClassWithDefaults(
      OmitType(classRef, keysToOmitOnCreate),
      defaults,
    ),
  };
};
