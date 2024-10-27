import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { Roles } from '../constants';

export class RoleStack extends Stack {
  public readonly codePipelineRole: Role;
  public readonly codeBuildRole: Role;
  public readonly defaultLambdaRole: Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.defaultLambdaRole = this.createDefaultLambdaRole();
    this.codeBuildRole = this.createCodeBuildRole();
    this.codePipelineRole = this.createCodePipelineRole();
  }

  private createCodePipelineRole(): Role {
    const role = new Role(this, Roles.CodePipeline, {
      assumedBy: new ServicePrincipal('codepipeline.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipeline_FullAccess')
      ]
    });
    return role;
  }

  private createCodeBuildRole(): Role {
    const role = new Role(this, Roles.CodeBuild, {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildDeveloperAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess')
      ]
    });
    return role;
  }

  private createDefaultLambdaRole(): Role {
    const role = new Role(this, Roles.LambdaDefaultExecution, {
      // Declare that Lambda service can assume this role
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        )
      ]
    });

    new CfnOutput(this, 'DefaultLambdaRoleArn', { value: role.roleArn });

    return role;
  }
}
