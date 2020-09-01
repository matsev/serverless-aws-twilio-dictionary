#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ServerlessDictionaryStack } from '../lib/serverless-dictionary-stack';

const app = new cdk.App();
new ServerlessDictionaryStack(app, 'ServerlessDictionaryStack');
