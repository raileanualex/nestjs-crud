import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICY_NAME_METADATA } from '../constants';
import type { PolicyGuardOpts, Policy } from '../types';
import { validatePolicies } from '../utils/validate';
import { createGetAndValidateResourceId } from './utils';

export class BasePolicyGuard implements CanActivate {
  constructor(public reflector: Reflector, public opts: PolicyGuardOpts) { }

  public canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const requiredPolicies = this.getRequiredPolicies(context);

    if (!requiredPolicies) {
      return true;
    }

    const { user, params, body } = context.switchToHttp().getRequest();

    const entityId = this.getAndValidateResourceId(this.opts.extractors, params, body);

    const isAllowed = this.hasCorrectPolicies(context, user[this.opts.userPolicyField] ?? [], entityId);

    if (!isAllowed) {
      throw new ForbiddenException();
    }

    return true;
  }

  public getRequiredPolicies(context: ExecutionContext): Policy[] | undefined {
    return this.reflector.getAllAndOverride<Policy[] | undefined>(
      POLICY_NAME_METADATA,
      [context.getHandler(), context.getClass()],
    );
  }

  public getAndValidateResourceId(opts: Required<PolicyGuardOpts["extractors"]>, params: Record<string, string | number>, body: Record<string, string | number>) {
    return createGetAndValidateResourceId({
      extractors: opts
    })(params, body);
  }

  public hasCorrectPolicies(context: ExecutionContext, userPolicies: string[], entityId: string | number) {
    const requiredPolicies = this.getRequiredPolicies(context);
    return validatePolicies(requiredPolicies, userPolicies, entityId);
  }
}