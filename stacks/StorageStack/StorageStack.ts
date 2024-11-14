import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { Buckets } from '../../constants';

export class StorageStack extends Stack {
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.artifactBucket = this.setupArtifactBucket();
  }

  private setupArtifactBucket(): s3.Bucket {
    const bucket = new s3.Bucket(this, Buckets.ArtifactBucket, {
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });
    return bucket;
  }
}
