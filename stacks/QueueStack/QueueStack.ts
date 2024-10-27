import { Stack, StackProps } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

import { Queues } from '../../constants';
import { SetupTaskQueueOutput } from './types';

export class QueueStack extends Stack {
  // A queue to hold the tasks to be processed
  public readonly taskQueue: Queue;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.taskQueue = this.setupTaskQueue();
  }

  setupTaskQueue(): SetupTaskQueueOutput {
    const queueName = Queues.Task;
    const queue = new Queue(this, queueName, { queueName });
    return queue;
  }
}
