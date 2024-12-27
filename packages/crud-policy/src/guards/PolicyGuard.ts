import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { POLICY_NAME_METADATA } from "../constants";
import { GetResourceIdFromReq, Policy } from "../types";
import { validatePolicies } from "../utils/validate";

export const createPolicyGuard = (getEntityId?: GetResourceIdFromReq) => {
  @Injectable()
  class PolicyGuard implements CanActivate {
    constructor(public reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
      const requiredPolicies = this.reflector.getAllAndOverride<Policy[]>(
        POLICY_NAME_METADATA,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredPolicies) {
        return true;
      }

      const { user, params, body } = context.switchToHttp().getRequest();

      const entityId = getEntityId?.(params, body);

      const isAllowed = validatePolicies(
        requiredPolicies,
        user.policies,
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
