import { ResourcePrefix } from './constants';

export const Stacks = {
  Api: `${ResourcePrefix}-api-stack`,
  Storage: `${ResourcePrefix}-storage-stack`,
  Role: `${ResourcePrefix}-role-stack`,
  Cicd: `${ResourcePrefix}-cicd-stack`,
  Lambda: `${ResourcePrefix}-lambda-stack`,
  Queue: `${ResourcePrefix}-queue-stack`
};
