import { BaseRouteName, OVERRIDE_METHOD_METADATA } from '../constants';

export const Override =
  (name?: BaseRouteName | keyof typeof BaseRouteName) =>
  (target, key, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(OVERRIDE_METHOD_METADATA, name || `${key}Base`, target[key]);
    return descriptor;
  };
