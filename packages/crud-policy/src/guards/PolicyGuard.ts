import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICY_NAME_METADATA } from '../constants';
import { PoliciesGuardOpts, Policy } from '../types';
import { validatePolicies } from '../utils/validate';
import { createRequestEntityIdGetter } from '../utils/get-relevant-id';

const createGetAndValidateResourceId = (opts: PoliciesGuardOpts) => {
  if (!opts.extractors) {
    return () => null;
  }

  const { getResourceIdFromBody, getResourceIdFromParams } = opts.extractors;

  return createRequestEntityIdGetter(getResourceIdFromBody, getResourceIdFromParams);
};

export const createPolicyGuard = (opts: PoliciesGuardOpts) => {
  const getAndValidateResourceId = createGetAndValidateResourceId(opts);

  @Injectable()
  class PolicyGuard implements CanActivate {
    constructor(public reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const requiredPolicies = this.reflector.getAllAndOverride<Policy[]>(
        POLICY_NAME_METADATA,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredPolicies) {
        return true;
      }

      const { user, params, body } = context.switchToHttp().getRequest();

      const entityId = getAndValidateResourceId(params, body);

      const isAllowed = validatePolicies(
        requiredPolicies,
        user[opts.userPolicyField] ?? [],
        entityId,
      );

      if (!isAllowed) {
        throw new ForbiddenException();
      }

      return true;
    }
  }

  return PolicyGuard;
};
