import 'dotenv/config';

import { CdkGraph, FilterPreset } from '@aws/pdk/cdk-graph';
import {
  CdkGraphDiagramPlugin,
  DiagramFormat
} from '@aws/pdk/cdk-graph-plugin-diagram';
import { App, Environment } from 'aws-cdk-lib';

import { Stacks } from './constants';
import { CicdStack, QueueStack, RoleStack, StorageStack } from './stacks';
import { config } from './utils';

// Wrap cdk app with async IIFE function to enable async cdk-graph report
// eslint-disable-next-line no-void
void (async function () {
  const app = new App();

  const env: Environment = {
    region: config.aws.region,
    account: config.aws.accountId
  };

  const bucketStorage = new StorageStack(app, Stacks.Storage, { env });

  const roleStack = new RoleStack(app, Stacks.Role, { env });

  new QueueStack(app, Stacks.Queue, { env });

  new CicdStack(app, Stacks.Cicd, {
    env,
    codePipelineRoleArn: roleStack.codePipelineRole.roleArn,
    codeBuildRoleArn: roleStack.codeBuildRole.roleArn,
    artifactBucketArn: bucketStorage.artifactBucket.bucketArn
  });

  // Generate a diagram for the whole architecture
  const group = new CdkGraph(app, {
    plugins: [
      new CdkGraphDiagramPlugin({
        diagrams: [
          {
            name: 'conduit-stack-diagram',
            title: 'Conduit Stack Diagram',
            format: DiagramFormat.PNG,
            theme: 'light',
            filterPlan: {
              preset: FilterPreset.COMPACT
            }
          }
        ]
      })
    ]
  });

  app.synth();

  await group.report();
})();
