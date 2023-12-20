import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';

import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import * as sns from "aws-cdk-lib/aws-sns"
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class CrukBackendAssignmentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const donationTopic = new sns.Topic(this, 'DonationTopic', {
      topicName: 'DonationTopic',
      fifo: false,
    })

    const table = new Table(this, "Users", {
      partitionKey: { name: "phoneNumber", type: AttributeType.STRING },
    });

    const lambda = new NodejsFunction(this, "DynamoLambdaHandler", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/function.ts`),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName,
        TOPIC_NAME: donationTopic.topicName,
        TOPIC_ARN: donationTopic.topicArn,
      },
    });

    donationTopic.grantPublish(lambda);
    table.grantReadWriteData(lambda);

    // Grant permissions to subscribe to the SNS topic
    lambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Subscribe', 'sns:Publish', 'sns:PublishAction'], // Add 'sns:Publish' action
        resources: [donationTopic.topicArn, '*'],
      })
    );

    const lambdaUrl = lambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
      }
    });

    new CfnOutput(this, 'FunctionUrl', {
      value: lambdaUrl.url,
    });
  }
}
