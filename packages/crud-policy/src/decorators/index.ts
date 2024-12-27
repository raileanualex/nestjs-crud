import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { POLICY_NAME_METADATA } from "../constants";
import type { PoliciesGuardOpts, Policy } from "../types";
import { createPolicyGuard } from "../guards/PolicyGuard";

export const Policies = (...policies: Policy[]) =>
  SetMetadata(POLICY_NAME_METADATA, policies);

const enhanceCrudTarget = (options: PoliciesGuardOpts, target: any) => {
  const methods = Object.getOwnPropertyNames(
    target.prototype,
  );

  const routes = options.routes ?? {
    getManyBase: [],
    getOneBase: [],
    createManyBase: [],
    createOneBase: [],
    updateOneBase: [],
    deleteOneBase: [],
    replaceOneBase: [],
    recoverOneBase: [],
  };

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
        UseGuards(createPolicyGuard(options.getResourceIdFromReq)),
      )(target);
    };
