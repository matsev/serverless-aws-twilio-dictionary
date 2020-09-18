const AWS = require('aws-sdk');
const querystring = require('querystring');
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const { DICTIONARY_TABLE_NAME, PARTITION_KEY } = process.env;
const DEFINITION = 'definition';
const TWILIO = 'twilio';


const create = async (word, definition) => {
    console.info(`create: '${word}' => '${definition}'`);
    const params = {
        TableName: DICTIONARY_TABLE_NAME,
        Item: {
            [PARTITION_KEY]: word,
            definition,
        },
        ConditionExpression: `attribute_not_exists(${PARTITION_KEY})`,
    };
    return documentClient.put(params).promise()
        .then(data => {
            console.info('created:', JSON.stringify(data));
            return {
                word,
                definition,
                msg: `Created: ${word} - ${definition}`,
            };
        })
        .catch(err => {
            console.info('created err:', JSON.stringify(err));
            const { code } = err;
            return code === 'ConditionalCheckFailedException'
                ? {
                    word,
                    msg: `Created: ${word} - Already exists`,
                }
                : Promise.reject(err);
        });
};


const read = async (word) => {
    console.info(`read: '${word}'`);
    const params = {
        TableName: DICTIONARY_TABLE_NAME,
        Key: {
            [PARTITION_KEY]: word,
        },
    };
    return documentClient.get(params).promise()
        .then(data => {
            console.info('read:', JSON.stringify(data));
            const { Item } = data;
            return Item
                ? {
                    word: Item[PARTITION_KEY],
                    definition: Item[DEFINITION],
                    msg: `Read: ${Item[PARTITION_KEY]} - ${Item[DEFINITION]}`,
                }
                : {
                    word,
                    msg: `Read: ${word} - No such word`,
                };
        });
};


const update = async (word, definition) => {
    console.info(`update: '${word}' => '${definition}'`);
    const params = {
        TableName: DICTIONARY_TABLE_NAME,
        Key: {
          [PARTITION_KEY]: word,
        },
        UpdateExpression: 'set #definition = :definition',
        ConditionExpression: `attribute_exists(${PARTITION_KEY})`,
        ExpressionAttributeNames: {
            '#definition': DEFINITION,
        },
        ExpressionAttributeValues: {
            ':definition': definition,
        },
    };
    return documentClient.update(params).promise()
        .then(data => {
            console.info('updated:', JSON.stringify(data));
            return {
                word,
                definition,
                msg: `Updated: ${word} - ${definition}`,
            };
        })
        .catch(err => {
            console.info('updated err:', JSON.stringify(err));
            const { code } = err;
            return code === 'ConditionalCheckFailedException'
                ? {
                    word,
                    msg: `Updated: ${word} - No such word`,
                }
                : Promise.reject(err);
            });
};


const del = async (word) => {
    console.info(`delete: '${word}'`);
    const params = {
        TableName: DICTIONARY_TABLE_NAME,
        Key: {
            [PARTITION_KEY]: word,
        },
    };
    return documentClient.delete(params).promise()
        .then(data => {
            console.info('deleted:', JSON.stringify(data));
            return {
                word,
                msg: `Deleted: ${word}`,
            };
        });
};


const COMMAND_TABLE = {
  C       : create,
  CREATE  : create,
  R       : read,
  READ    : read,
  U       : update,
  UPDATE  : update,
  D       : del,
  DELETE  : del,
};


const extractBody = (base64Str) => {
    const input = Buffer.from(base64Str, 'base64').toString('utf8');
    console.info(`decoded: '${input}'`);

    const { Body } = querystring.parse(input);
    console.info(`Body: '${Body}'`);
    return Body;
};


const createTwiML = (msg) => {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message><Body>${msg}</Body></Message>
</Response>`;

    return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
            'Content-Type': 'text/xml',
        },
        body,
    };
};


exports.handler = async (event, context) => {
    console.info('Received event:', JSON.stringify(event));
    const { body, headers: { 'user-agent' : userAgent } } = event;
    const msgBody = extractBody(body);

    const [ command, word, ...definition ] = msgBody.split(' ');
    const func = COMMAND_TABLE[command.toUpperCase()];

    const result = func
        ? await func(word, definition.join(' '))
        // default to 'read' if there is no matching command. In that case, the 'key' is passed as the 'command'
        : await read(command);

    console.info('result:', JSON.stringify(result));

    return userAgent.toLowerCase().includes(TWILIO)
        ? createTwiML(result.msg)
        : {
            word,
            ...result,
        };
};
