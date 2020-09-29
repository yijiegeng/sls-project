import createError from 'http-errors';
import { getEndedAuctions } from '../lib/getEndedAuctions';
import { closeAuction } from '../lib/closeAuction';

async function processAuctions(event, context) {

    try {
        // Get all colsed auctions
        const auctionsToClose = await getEndedAuctions();
        // Loop each auction in "auctionsToClose" result, 
        // then call the helper function "closeAuction"
        const closePromises = auctionsToClose.map(auction => closeAuction(auction));
        // When call the helper function, we don't have to wait for each result
        // i.e. we can keep calling "closeAuction" one by one, only need to wait final result 
        await Promise.all(closePromises);
        
        // This function can return whatever we want not only "http structure"
        // because this function not triggered by API Gateway
        return { colsed: closePromises.length };

    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
}

export const handler = processAuctions;