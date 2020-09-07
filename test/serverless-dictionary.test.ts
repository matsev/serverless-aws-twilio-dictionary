import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as ServerlessDictionary from '../lib/serverless-dictionary-stack';

test('Verify Stack', () => {
    const app = new cdk.App();

    const stack = new ServerlessDictionary.ServerlessDictionaryStack(app, 'MyTestStack');

    expectCDK(stack).to(haveResource('AWS::ApiGatewayV2::Api'));
    expectCDK(stack).to(haveResource('AWS::Lambda::Function'));
    expectCDK(stack).to(haveResource('AWS::DynamoDB::Table'));
});
