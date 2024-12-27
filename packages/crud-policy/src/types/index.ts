import { BaseRouteName } from "@n4it/crud";
import { PolicyActions } from "../constants";

export type Policy = {
  name: string;
  action: PolicyActions;
}

export type PoliciesGuardOpts = {
  routes?: {
    [K in BaseRouteName]?: Policy[];
  };
  getResourceIdFromReq?: GetResourceIdFromReq;
};

export type GetResourceIdFromReq = (
  params: Record<string, string | number>,
  body: Record<string, string | number>,
) => string | number;