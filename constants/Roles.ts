import { ResourcePrefix } from './constants';

export const Roles = {
  LambdaDefaultExecution: `${ResourcePrefix}-default-lambda-execution-role`,
  CodePipeline: `${ResourcePrefix}-codepipeline-role`,
  CodeBuild: `${ResourcePrefix}-codebuild-role`
};
