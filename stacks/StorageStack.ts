import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { Buckets } from '../constants';

export class StorageStack extends Stack {
  public readonly artifactBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.artifactBucket = this.getArtifactBucket();
  }

  private getArtifactBucket(): Bucket {
    const bucket = new Bucket(this, Buckets.ArtifactBucket, {
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    return bucket;
  }
}
