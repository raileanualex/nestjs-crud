import {
  QueryFilter,
  SCondition,
} from '@n4it/crud-request/lib/types/request-query.types';

export type QueryFilterFunction = (
  search?: SCondition,
  getMany?: boolean,
) => SCondition | void;
export type QueryFilterOption = QueryFilter[] | SCondition | QueryFilterFunction;
