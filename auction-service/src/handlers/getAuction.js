import AWS, { AppStream } from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

// define the API to manipulate the DB
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Helper function
export async function getAuctionById(id){
    let auction;                            // define a let variable

    /**
     *  Interactive with DB
     */
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
    }
    
    try {
        const result = await dynamodb.get(params).promise();
        auction = result.Item;              // assign the let variable
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    // Check if search result dosn't exist
    if (!auction) {
        throw new createError.NotFound(`Auction with ID "${id}" not found!`);
    }
    
    return auction;
}


async function getAuction(event, context) {
    const { id } = event.pathParameters;        // define a const variable
    const auction = await getAuctionById(id);   // call the helper function

    return {
        statusCode: 200,
        body: JSON.stringify(auction),
    };
}

export const handler = commonMiddleware(getAuction);