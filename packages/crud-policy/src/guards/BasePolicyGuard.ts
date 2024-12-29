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

    const entityId = this.getAndValidateResourceId(params, body);

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

  public getAndValidateResourceId(params: Record<string, unknown>, body: Record<string, unknown>) {
    return createGetAndValidateResourceId({
      extractors: this.opts.extractors,
    })(params, body);
  }

  public hasCorrectPolicies(context: ExecutionContext, userPolicies: string[], entityId: string | number) {
    const requiredPolicies = this.getRequiredPolicies(context);
    return validatePolicies(requiredPolicies, userPolicies, entityId);
  }
}