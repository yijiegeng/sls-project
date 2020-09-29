import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';
import commonMiddleware from '../lib/commonMiddleware';
import placeBidSchema from '../lib/schemas/placeBidSchema'
import { getAuctionById } from './getAuction';

// define the API to manipulate the DB
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    let updatedAuction;                     // define a let variable
    const { id } = event.pathParameters;    // define a const variable
    const { amount } = event.body;
    const { email } = event.requestContext.authorizer;

    const auction = await getAuctionById(id);   // call the helper function

    /**
     *  Bid action validation
     */
    // Check if this auction is CLOSED
    if(auction.status !== 'OPEN') {
        throw new createError.Forbidden(`You cannot bid on closed auctions!`);
    }
    // Check if the user is the previous bidder
    if(email === auction.seller) {
        throw new createError.Forbidden(`You cannot bid on your own auctions!`);
    }
    if(email === auction.highestBid.bidder) {
        throw new createError.Forbidden(`You are alreay the highest bidder!`);
    }
    // Check if amount is less than current amount
    if(amount <= auction.highestBid.amount) {
        throw new createError.Forbidden(`Your bid must be higher tha ${auction.highestBid.amount}!`);
    }

    /**
     *  Interactive with DB
     */
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',   // dynamoDB language 
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email,
        },
        ReturnValues: 'ALL_NEW',
    };

    try {
        const result = await dynamodb.update(params).promise(); 
        updatedAuction = result.Attributes;     // assign the let variable
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
}

export const handler = commonMiddleware(placeBid)
    .use(validator({ inputSchema: placeBidSchema }));