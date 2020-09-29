import AWS from 'aws-sdk';

const ses = new AWS.SES({ region: 'eu-west-1' });

async function sendMail(event, context) {
    const record = event.Records[0];     // single message that gonna be proccessed
    console.log('record processing', record);

    const email = JSON.parse(record.body);  // SQS only receive String, so we need parse
    const { subject, body, recipient } = email;

    const params = {
        Source: 'yijiegeng.test@gmail.com',
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Text: {
                    Data: body,
                },
            },
            Subject: {
                Data: subject,
            },
        },
    };

    try {
        const result = await ses.sendEmail(params).promise();
        console.log(result);
        return result;
    } catch (error) {
        console.error(error);
    }
}

export const handler = sendMail;