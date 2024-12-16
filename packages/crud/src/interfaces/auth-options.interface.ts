import type { SCondition } from '@n4it/crud-request/lib/types/request-query.types';
import type { ObjectLiteral } from '@n4it/crud-util';
import type { ClassTransformOptions } from 'class-transformer';

export interface AuthGlobalOptions {
  property?: string;
  /** Get options for the `classToPlain` function (response) */
  classTransformOptions?: (req: any) => ClassTransformOptions;
  /** Get `groups` value for the `classToPlain` function options (response) */
  groups?: (req: any) => string[];
}

export interface AuthOptions {
  property?: string;
  /** Get options for the `classToPlain` function (response) */
  classTransformOptions?: (req: any) => ClassTransformOptions;
  /** Get `groups` value for the `classToPlain` function options (response) */
  groups?: (req: any) => string[];
  filter?: (req: any) => SCondition | void;
  or?: (req: any) => SCondition | void;
  persist?: (req: any) => ObjectLiteral;
}
