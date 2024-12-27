import { BaseRouteName } from '@n4it/crud';
import { PolicyActions } from '../constants';

export type Policy = {
  name: string;
  action: PolicyActions;
};

export type PoliciesGuardOpts = {
  routes?: {
    [K in BaseRouteName]?: PolicyActions[];
  };
  policyName: string;
  userPolicyField: string;
  extractors?: {
    getResourceIdFromBody: GetResourceIdFromBody;
    getResourceIdFromParams: GetResourceIdFromParams;
  };
};

export type GetResourceIdFromParams = (
  params: Record<string, string | number>,
) => string | number;

export type GetResourceIdFromBody = (
  body: Record<string, string | number>,
) => string | number;
