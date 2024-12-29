import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PolicyGuardOpts } from '../../types';
import { createRequestEntityIdGetter } from '../../utils/get-relevant-id';
import { BasePolicyGuard } from '../BasePolicyGuard';

export const createGetAndValidateResourceId = (
  opts: Pick<PolicyGuardOpts, 'extractors'>,
) => {
  if (!opts.extractors) {
    return () => null;
  }

  const { getResourceIdFromBody, getResourceIdFromParams } = opts.extractors;

  return createRequestEntityIdGetter(getResourceIdFromBody, getResourceIdFromParams);
};

export const createPolicyGuard = (opts: PolicyGuardOpts) => {
  @Injectable()
  class PolicyGuard extends BasePolicyGuard {
    constructor(public reflector: Reflector) {
      super(reflector, opts);
    }
  }

  return PolicyGuard;
};
