import { UnauthorizedException } from '@nestjs/common';

export type GetIdFromBody = (body: Record<string, string>) => string | number | null;
export type GetIdFromParams = (params: Record<string, string>) => string | number | null;

export enum Error {
  ID_MISMATCH = 'Requested id does not match',
}

export const isSameIdInBodyAndParams = (
  bodyId: string | number | null,
  paramsId: string | number | null,
) => {
  if (bodyId && paramsId && bodyId !== paramsId) {
    return false;
  }

  return true;
};

export const createRequestEntityIdGetter = (
  getIdFromBody: GetIdFromBody,
  getIdFromParams: GetIdFromParams,
) => {
  return (params: Record<string, string>, body: Record<string, string>) => {
    const idFromBody = getIdFromBody(body);
    const idFromParams = getIdFromParams(params);

    // if the user is trying to access an entity, we need to make sure the user is not trying to access another one
    if (!isSameIdInBodyAndParams(idFromBody, idFromParams)) {
      throw new UnauthorizedException(Error.ID_MISMATCH);
    }

    // we get the id from the body or the parameters to see what the user is trying to access
    // we do not care who the user is, we just want to know what they are trying to access
    // validating who the user is, is done in the policy validation function
    return idFromBody ?? idFromParams;
  };
};
