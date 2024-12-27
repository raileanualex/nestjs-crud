import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { POLICY_NAME_METADATA, PolicyActions } from "../constants";
import type { PoliciesGuardOpts, Policy } from "../types";
import { createPolicyGuard } from "../guards/PolicyGuard";
import { BaseRouteName } from "@n4it/crud";

export const Policies = (...policies: Policy[]) =>
  SetMetadata(POLICY_NAME_METADATA, policies);

const createDefaultPolicies = (opts: PoliciesGuardOpts): {
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
})

const enhanceCrudTarget = (options: PoliciesGuardOpts, target: any) => {
  const methods = Object.getOwnPropertyNames(
    target.prototype,
  );

  const routes = options.routes ?? createDefaultPolicies(options);

  methods.forEach((methodName) => {
    const policies = routes[methodName];

    if (!["constructor"].includes(methodName) && Array.isArray(policies)) {
      Policies(...policies)(target.prototype[methodName]);
    }
  });
}

export const CrudPolicies =
  (options: PoliciesGuardOpts) =>
    (target: any) => {
      enhanceCrudTarget(options, target);
      applyDecorators(
        UseGuards(createPolicyGuard(options)),
      )(target);
    };
