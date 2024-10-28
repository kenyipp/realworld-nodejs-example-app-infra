export interface Config {
  nodeEnv: 'develop' | 'prod';
  appDomain?: string;
  aws: {
    region: string;
    accountId: string;
    certificateArn?: string;
  };
  github: {
    infra: {
      owner: string;
      repository: string;
    };
    conduitServer: {
      owner: string;
      repository: string;
    };
  };
}
