import { PolicyActions } from "../constants";

export const makePolicy =
  (action: PolicyActions) => (entity: string, entityId?: string | number) => {
    if (!entityId) {
      return `${entity}:${action}`;
    }

    return `${entity}:${action}:${entityId}`;
  };

export const createReadPolicy = makePolicy(PolicyActions.Read);
export const createWritePolicy = makePolicy(PolicyActions.Write);
export const createManagePolicy = makePolicy(PolicyActions.Manage);
