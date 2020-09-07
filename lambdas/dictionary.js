const AWS = require('aws-sdk');
const querystring = require('querystring');
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const { DICTIONARY_TABLE_NAME, WORD } = process.env;
const MEANING = 'meaning';
const TWILIO = 'twilio';


const create = async (word, meaning) => {
    console.info(`create: '${word}' => '${meaning}'`);
    const params = {
        TableName: DICTIONARY_TABLE_NAME,
        Item: {
            [WORD]: word,
            [MEANING]: meaning,
        },
        ConditionExpression: `attribute_not_exists(${WORD})`,
    };
    return documentClient.put(params).promise()
        .then(data => {
            console.info('created:', JSON.stringify(data));
            return {
                word,
                meaning,
                msg: `Created: ${word} - ${meaning}`,
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
            [WORD]: word,
        },
    };
    return documentClient.get(params).promise()
        .then(data => {
            console.info('read:', JSON.stringify(data));
            const { Item } = data;
            return Item
                ? {
                    word: Item[WORD],
                    meaning: Item[MEANING],
                    msg: `Read: ${Item[WORD]} - ${Item[MEANING]}`,
                }
                : {
                    word,
                    msg: `Read: ${word} - No such word`,
                };
        });
};


const update = async (word, meaning) => {
    console.info(`update: '${word}' => '${meaning}'`);
    const params = {
        TableName: DICTIONARY_TABLE_NAME,
        Key: {
          [WORD]: word,
        },
        UpdateExpression: `set #meaning = :meaning`,
        ConditionExpression: `attribute_exists(${WORD})`,
        ExpressionAttributeNames: {
            '#meaning': MEANING,
        },
        ExpressionAttributeValues: {
            ':meaning': meaning,
        },
    };
    return documentClient.update(params).promise()
        .then(data => {
            console.info('updated:', JSON.stringify(data));
            return {
                word,
                meaning,
                msg: `Updated: ${word} - ${meaning}`,
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
            [WORD]: word,
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


const parseMsg = (base64Str) => {
    const input = Buffer.from(base64Str, 'base64').toString('utf8');
    console.info(`decoded: '${input}'`);
    const { Body } = querystring.parse(input);
    console.info(`Body: '${Body}'`);

    const body = Body.split(' ');

    const command = body[0].toLowerCase();
    let func;
    let word = body[1];
    let meaning;

    switch (command) {
        case 'c':
        case 'create':
            func = create;
            meaning = body.slice(2).join(' ');
            break;

        case 'd':
        case 'delete':
            func = del;
            break;


        case 'u':
        case 'update':
            func = update;
            meaning = body.slice(2).join(' ');
            break;

        case 'r':
        case 'read':
            func = read;
            break;

        default:
            // default to "read" if no command is specified
            func = read;
            word = body[0];
            break;
    }

    return {
        func,
        word,
        meaning,
    };
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


exports.handler = async function(event, context) {
    console.info('Received event:', JSON.stringify(event));
    const { body, headers: { 'user-agent' : userAgent } } = event;


    const { func, word, [MEANING]: receivedMeaning } = parseMsg(body);
    const result = await func(word, receivedMeaning);

    console.info('result:', JSON.stringify(result));

    const { msg, meaning } = result;
    return userAgent.toLowerCase().includes(TWILIO)
        ? createTwiML(msg)
        : {
            word,
            meaning,
            msg,
        };
};
