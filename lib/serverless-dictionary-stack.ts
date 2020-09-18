import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2'
import * as logs from "@aws-cdk/aws-logs";


const PARTITION_KEY = 'word';


export class ServerlessDictionaryStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // DynamoDB table for persistence
    const dictionaryTable = new dynamodb.Table(this, 'DictionaryTable', {
      partitionKey: {
        name: PARTITION_KEY,
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });


    // Lambda function for request handling
    const dictionaryLambda = new lambda.Function(this, 'DictionaryLambda', {
      description: 'Handles requests to the dictionary',
      runtime: lambda.Runtime.NODEJS_12_X,
      code: new lambda.AssetCode('lambdas'),
      handler: 'dictionary.handler',
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        DICTIONARY_TABLE_NAME: dictionaryTable.tableName,
        PARTITION_KEY: PARTITION_KEY,
      }
    });
    dictionaryTable.grantReadWriteData(dictionaryLambda);


    // HttpApi fpr request mapping
    const dictionaryIntegration = new apigatewayv2.LambdaProxyIntegration({
      handler: dictionaryLambda,
    });
    const dictionaryApi = new apigatewayv2.HttpApi(this, 'DictionaryApi');
    dictionaryApi.addRoutes({
      path: '/',
      integration: dictionaryIntegration,
      methods: [ apigatewayv2.HttpMethod.POST ],
    });


    new cdk.CfnOutput(this, 'DictionaryTableName', {
      value: dictionaryTable.tableName,
    });

    new cdk.CfnOutput(this, 'PublicDomainName', {
      value: dictionaryApi.url || 'unknown',
    });
  }
}
