# Serverless AWS Twilio Dictionary

A serverless dictionary hosted on AWS with Twilio account integration that enables SMS communication.


## Usage

After installation, you can interact with the dictionary using the following syntax:

> [command] word [definition]

There are four commands (see list below). If omitted, the command defaults to `read`. The `word` is the dictionary key and one must be provided with all dictionary interactions. The `definition` part is used when creating or updating the meaning of different words. 

| Command   | Abbreviation  | Comment                                           |
| --------- | ------------- | ------------------------------------------------- |
| `create`  | `c`           | Creates a new entry in the dictionary             | 
| `read`    | `r`           | Reads an entry from dictionary (default command)  | 
| `update`  | `u`           | Updates a dictionary entry                        |
| `delete`  | `d`           | Deletes a dictionary entry                        |


Examples:

> create TLA Three Letter Acronym

Adds the entry `TLA` with the definition `Three Letter Acronym` to the dictionary

> r TLA

or just 

> TLA 

reads the value of the `TLA` entry 

 
## Architecture

![architecture.svg](architecture.svg)

The phone sends an SMS message to the Twilio platform which in turn performs a HTTP request to the serverless dictionary in the AWS cloud. The HTTP response from the serverless dictionary is then translated back to text by the Twilio platform before it sends it back to the phone as another SMS message. Consequently, the Twilio platform is responsible for phone the phone interaction and the AWS part is responsible for the providing HTTP communication, application logic and storage. Consequently, the AWS parrts consists of a HTTP API that forwards the request to a Lambda function, which in turns communicate with a DynamoDB table.


## AWS Installation

### Prerequisites

- An AWS account
- AWS CLI [installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and [configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- [Node.js](https://nodejs.org/en/) version 12.x (see [.nvmrc](.nvmrc)) if you are using nvm


### Step by Step

1. Clone the project
2. Install the dependencies: `$ npm install`
3. Compile the AWS CDK TypeScript to JavaScript: `npm run build`
4. Synthesize and deploy the infrastructure to AWS CloudFormation: `npx cdk deploy `
5. Take note of the `ServerlessDictionaryStack.PublicDomainName` output value as this will be used later
6. Verify that the serverless dictionary was deployed successfully by executing the [post.sh](post.sh) script, e.g.
    ```bash
    ./post.sh "create TLA Three Letter Acronym"
    ```


## Twilio Integration

1. Go to the [https://www.twilio.com](https://www.twilio.com) and create an account
2. [Get a Twilio Phone Number](https://www.twilio.com/docs/sms/quickstart/node#sign-up-for-twilio-and-get-a-twilio-phone-number)
3. In the phone number's configuration options, find the `Messaging` part
    1. Find the `A Message Comes In` section
    2. Change the value to `Webhook`
    3. Configure the value of `ServerlessDictionaryStack.PublicDomainName` as mentioned earlier as webhook URL. Hint, if you forgot to copy it, you can find it in the outputs of your CloudFormation stack in the AWS Console 
Please see details at [Configure a Webhook URL](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js#configure-your-webhook-url).
  

## AWS CDK

The project infrastructure is based on the [AWS CDK](https://aws.amazon.com/cdk/). The [cdk.json](cdk.json) file tells the CDK Toolkit how to execute your app. For more information, execute the `npx cdk help`.

### AWS CDK Commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
