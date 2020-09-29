import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';
import commonMiddleware from '../lib/commonMiddleware';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';


// define the API to manipulate the DB
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
    /**
     *  define data varable here
     */
    const { title } = event.body
    const { email } = event.requestContext.authorizer;

    const now = new Date();
    const endDate = new Date();
    endDate.setHours(now.getHours() + 1);   // close Auction in 1 hour
    // endDate.setDays(now.getDays() + 1);     // close Auction in 1 day

    const auction = {
        id: uuid(),
        title,
        status: 'OPEN',
        createdAt: now.toISOString(),
        endingAt: endDate.toISOString(),
        highestBid: {
            amount : 0,
        },
        seller: email,
    };

    /**
     *  Interactive with DB
     */

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME, 
        Item: auction,
    }

    try {
        await dynamodb.put(params).promise();   // ensure put option would be executed
    } catch(error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
    

    /**
     *  all varibles and operations should before the "return"
     */
    return {
        statusCode: 201,
        body: JSON.stringify(auction),
    };
}

export const handler = commonMiddleware(createAuction)
    .use(validator({ inputSchema: createAuctionSchema }));