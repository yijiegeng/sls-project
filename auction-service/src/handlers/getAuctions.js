import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator'
import commonMiddleware from '../lib/commonMiddleware';
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema';


// define the API to manipulate the DB
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
    
    const { status } = event.queryStringParameters; // define a const variable
    let auctions;                                   // define a let variable

    /**
     *  Interactive with DB
     */
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',   // dynamoDB language 
        ExpressionAttributeValues: {
            ':status': status,
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
    };

    try {
        const result = await dynamodb.query(params).promise();
        auctions = result.Items;    // assign the let variabl
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(auctions),
    };
}

export const handler = commonMiddleware(getAuctions)
    .use(validator({ inputSchema: getAuctionsSchema, useDefaults: true}));