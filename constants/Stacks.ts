import { ResourcePrefix } from './constants';

export const Stacks = {
  Storage: `${ResourcePrefix}-storage-stack`,
  Role: `${ResourcePrefix}-role-stack`,
  Cicd: `${ResourcePrefix}-cicd-stack`,
  Queue: `${ResourcePrefix}-queue-stack`
};
