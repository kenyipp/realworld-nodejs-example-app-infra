import { Aws } from 'aws-cdk-lib';

import { config } from '../utils';

const app = 'conduit';
const accountId = config.aws.accountId ?? Aws.ACCOUNT_ID;

export const ResourcePrefix = `${app}-${config.nodeEnv}-${accountId}`;
