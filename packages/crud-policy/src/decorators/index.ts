import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { POLICY_NAME_METADATA, PolicyActions } from '../constants';
import type { PolicyGuardOpts, Policy } from '../types';
import { createPolicyGuard } from '../guards/utils';
import { BaseRouteName } from '@n4it/crud';

export const Policies = (...policies: Policy[]) =>
  SetMetadata(POLICY_NAME_METADATA, policies);

export const createDefaultPolicies = (
  opts: PolicyGuardOpts,
): {
  [K in keyof typeof BaseRouteName]?: Policy[];
} => ({
  createOneBase: [{ name: opts.policyName, action: PolicyActions.Write }],
  updateOneBase: [{ name: opts.policyName, action: PolicyActions.Write }],
  replaceOneBase: [{ name: opts.policyName, action: PolicyActions.Manage }],
  deleteOneBase: [{ name: opts.policyName, action: PolicyActions.Manage }],
  getOneBase: [{ name: opts.policyName, action: PolicyActions.Read }],
  createManyBase: [{ name: opts.policyName, action: PolicyActions.Write }],
  getManyBase: [{ name: opts.policyName, action: PolicyActions.Read }],
  recoverOneBase: [{ name: opts.policyName, action: PolicyActions.Manage }],
});

export const enhanceCrudTarget = (opts: PolicyGuardOpts, target: any) => {
  const methods = Object.getOwnPropertyNames(target.prototype);
  const defaultPolicies = createDefaultPolicies(opts);
  const routes = { ...defaultPolicies, ...opts.routes };

  methods.forEach((methodName) => {
    const policies = routes[methodName];

    if (
      !['constructor'].includes(methodName) &&
      Object.values(BaseRouteName).includes(methodName as BaseRouteName) &&
      Array.isArray(policies)
    ) {
      Policies(...policies)(target.prototype[methodName]);
    }
  });
};

export const CrudPolicies = (opts: PolicyGuardOpts) => (target: any) => {
  enhanceCrudTarget(opts, target);
  applyDecorators(UseGuards(createPolicyGuard(opts)))(target);
};
