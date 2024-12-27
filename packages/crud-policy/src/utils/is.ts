import { PolicyActions } from "../constants";

export const isReadAction = (action: PolicyActions) =>
  action === PolicyActions.Read;

export const isReadOrWriteAction = (action: PolicyActions) =>
  [PolicyActions.Read, PolicyActions.Write].includes(action);

export const isManageAction = (action: PolicyActions) =>
  action === PolicyActions.Manage;
