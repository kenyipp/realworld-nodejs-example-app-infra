import { StackProps } from 'aws-cdk-lib';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export interface CicdStackProps extends StackProps {
  artifactBucketArn: string;
  codeBuildRoleArn: string;
  codePipelineRoleArn: string;
}

/**
 *
 * function: convertArnToCdkObject
 *
 */
export interface ConvertArnToCdkObjectInput {
  artifactBucketArn: string;
  codeBuildRoleArn: string;
  codePipelineRoleArn: string;
}

export interface ConvertArnToCdkObjectOutput {
  artifactBucket: IBucket;
  codeBuildRole: IRole;
  pipelineRole: IRole;
}

/**
 *
 * function: setupBuildConfigPipeline
 *
 */
export interface SetupBuildConfigPipelineInput {
  pipelineRole: IRole;
  codeBuildRole: IRole;
  artifactBucket: IBucket;
}

export type SetupBuildConfigPipelineOutput = Pipeline;

/**
 *
 * function: setupAppDeployPipeline
 *
 */
export interface SetupAppDeployPipelineInput {
  pipelineRole: IRole;
  codeBuildRole: IRole;
  artifactBucket: IBucket;
}

export type SetupAppDeployPipelineOutput = Pipeline;
