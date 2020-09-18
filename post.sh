#!/usr/bin/env bash

endpoint=$(aws cloudformation describe-stacks --stack-name ServerlessDictionaryStack --query 'Stacks[0].Outputs[?OutputKey==`PublicDomainName`].OutputValue' --output text)
curl --data-binary "Body=${*}" "${endpoint}"
