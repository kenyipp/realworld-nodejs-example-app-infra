import { Aws, CfnOutput, Stack } from 'aws-cdk-lib';
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject
} from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CodeBuildAction,
  GitHubSourceAction,
  GitHubTrigger
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

import { PipelineProjects, Pipelines, Secrets, Stacks } from '../../constants';
import { config } from '../../utils';
import {
  CicdStackProps,
  ConvertArnToCdkObjectInput,
  ConvertArnToCdkObjectOutput,
  SetupAppDeployPipelineInput,
  SetupAppDeployPipelineOutput,
  SetupBuildConfigPipelineInput,
  SetupBuildConfigPipelineOutput
} from './types';

export class CicdStack extends Stack {
  public readonly buildConfigPipeline: Pipeline;
  public readonly appDeployPipeline: Pipeline;

  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    /**
     *
     * Get the Arns of the roles and bucket from the props,
     * and transform them into CDK objects
     *
     */
    const { artifactBucket, codeBuildRole, pipelineRole } =
      this.convertArnToCdkObject(props);

    // Setup the build config pipeline which update the infrastructure
    this.buildConfigPipeline = this.setupBuildConfigPipeline({
      artifactBucket,
      codeBuildRole,
      pipelineRole
    });

    // Setup the app deploy pipeline which deploys the application
    this.appDeployPipeline = this.setupAppDeployPipeline({
      artifactBucket,
      codeBuildRole,
      pipelineRole
    });
  }

  private setupAppDeployPipeline({
    artifactBucket,
    codeBuildRole,
    pipelineRole
  }: SetupAppDeployPipelineInput): SetupAppDeployPipelineOutput {
    // Define the artifacts for passing through the pipeline
    const sourceOutput = new Artifact();

    const githubToken = Secret.fromSecretNameV2(
      this,
      `${Stacks.Cicd}-app-deploy-pipeline-github-token`,
      Secrets.GithubToken
    );

    const databaseConfig = Secret.fromSecretNameV2(
      this,
      `${Stacks.Cicd}-app-deploy-pipeline-database-config`,
      Secrets.DatabaseConfig
    );

    const jwtSecret = Secret.fromSecretNameV2(
      this,
      `${Stacks.Cicd}-app-deploy-pipeline-jwt-secret`,
      Secrets.JwtSecret
    );

    const buildSpec = BuildSpec.fromObject({
      version: '0.2',
      env: {
        variables: {
          NODE_ENV: config.nodeEnv,
          AWS_REGION: Aws.REGION,
          AWS_ACCOUNT_ID: Aws.ACCOUNT_ID,
          DATABASE_HOST: databaseConfig.secretValueFromJson('host').toString(),
          DATABASE_NAME: databaseConfig.secretValueFromJson('dbname').toString(),
          DATABASE_USER: databaseConfig.secretValueFromJson('username').toString(),
          DATABASE_PASSWORD: databaseConfig
            .secretValueFromJson('password')
            .toString(),
          DATABASE_PORT: databaseConfig.secretValueFromJson('port').toString(),
          AUTH_JWT_SECRET: jwtSecret.secretValue.toString()
        }
      },
      phases: {
        install: {
          commands: [
            // Install the required global dependencies to build the project
            'yarn global add turbo aws-cdk',
            // Install dependencies for the entire project
            'yarn install',
            'cd ./infra',
            // Install dependencies for the infrastructure
            'yarn install',
            'cd ..'
          ]
        },
        pre_build: {
          commands: [
            'cd ./packages/core',
            'yarn db:migrate', // Run the database migrations before deploying the apps
            'cd ../..'
          ]
        },
        build: {
          commands: [
            'yarn build', // Build the project
            'yarn install --production --frozen-lockfile' // Ensure only production dependencies
          ]
        },
        post_build: {
          commands: [
            'cd ./infra',
            `yarn deploy --exclusively ${Stacks.Lambda}`, // Deploy the lambda function using AWS CDK
            `yarn deploy --exclusively ${Stacks.Api}` // Deploy the api using AWS CDK
          ]
        }
      },
      artifacts: {
        files: ['**/*']
      }
    });

    const codeBuildProject = new PipelineProject(
      this,
      PipelineProjects.AppDeployPipelineProject,
      {
        environment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
          privileged: false // We don't need Docker builds for deployment
        },
        buildSpec,
        role: codeBuildRole
      }
    );

    const pipeline = new Pipeline(this, Pipelines.AppDeploy, {
      role: pipelineRole,
      pipelineName: Pipelines.AppDeploy,
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new GitHubSourceAction({
              actionName: 'GitHubSource',
              owner: config.github.conduitServer.owner,
              repo: config.github.conduitServer.repository,
              oauthToken: githubToken.secretValue,
              branch: config.nodeEnv, // We are using the branch as the environment
              output: sourceOutput,
              trigger: GitHubTrigger.NONE // We don't want to trigger the pipeline on every push
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'Build',
              project: codeBuildProject,
              input: sourceOutput
            })
          ]
        }
      ]
    });

    new CfnOutput(this, 'AppDeployPipelineArn', {
      value: pipeline.pipelineArn
    });

    return pipeline;
  }

  private setupBuildConfigPipeline({
    artifactBucket,
    codeBuildRole,
    pipelineRole
  }: SetupBuildConfigPipelineInput): SetupBuildConfigPipelineOutput {
    // Define the artifacts for passing through the pipeline
    const sourceOutput = new Artifact();

    const githubToken = Secret.fromSecretNameV2(
      this,
      `${Stacks.Cicd}-build-config-pipeline-github-token`,
      Secrets.GithubToken
    );

    const buildSpec = BuildSpec.fromObject({
      version: '0.2',
      env: {
        variables: {
          NODE_ENV: config.nodeEnv,
          AWS_REGION: Aws.REGION,
          AWS_ACCOUNT_ID: Aws.ACCOUNT_ID
        }
      },
      phases: {
        install: {
          commands: [
            // Install the required global dependencies to build the project
            'yarn global add aws-cdk',
            // Install dependencies for the infrastructure
            'yarn install'
          ]
        },
        build: {
          commands: [
            `yarn deploy ${Stacks.Cicd}` // Deploy the lambda function using AWS CDK
          ]
        }
      },
      artifacts: {
        files: ['**/*']
      }
    });

    const codeBuildProject = new PipelineProject(
      this,
      PipelineProjects.BuildConfigPipelineProject,
      {
        environment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
          privileged: false // We don't need Docker builds for deployment
        },
        buildSpec,
        role: codeBuildRole
      }
    );

    const pipeline = new Pipeline(this, Pipelines.BuildConfig, {
      role: pipelineRole,
      pipelineName: Pipelines.BuildConfig,
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new GitHubSourceAction({
              actionName: 'GitHubSource',
              owner: config.github.infra.owner,
              repo: config.github.infra.repository,
              oauthToken: githubToken.secretValue,
              branch: config.nodeEnv, // We are using the branch as the environment
              output: sourceOutput,
              trigger: GitHubTrigger.NONE // We don't want to trigger the pipeline on every push
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'Build',
              project: codeBuildProject,
              input: sourceOutput
            })
          ]
        }
      ]
    });

    new CfnOutput(this, 'BuildConfigPipelineArn', {
      value: pipeline.pipelineArn
    });

    return pipeline;
  }

  private convertArnToCdkObject({
    artifactBucketArn,
    codeBuildRoleArn,
    codePipelineRoleArn
  }: ConvertArnToCdkObjectInput): ConvertArnToCdkObjectOutput {
    const artifactBucket = Bucket.fromBucketArn(
      this,
      `${Stacks.Cicd}-artifact-bucket`,
      artifactBucketArn
    );
    const codeBuildRole = Role.fromRoleArn(
      this,
      `${Stacks.Cicd}-codebuild-role`,
      codeBuildRoleArn
    );
    const pipelineRole = Role.fromRoleArn(
      this,
      `${Stacks.Cicd}-pipeline-role`,
      codePipelineRoleArn
    );
    return { artifactBucket, codeBuildRole, pipelineRole };
  }
}
