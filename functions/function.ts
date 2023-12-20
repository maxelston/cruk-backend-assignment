import { Handler } from 'aws-lambda';

import { DynamoDB, SNS } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const TABLE_NAME : string = process.env.TABLE_NAME!;
const TOPIC_ARN : string = process.env.TOPIC_ARN!;
const MESSAGE = 'Thanks for donating!';

type Donation = {
    name: string;
    donations: number;
    phoneNumber: string;
  };
  

export const handler: Handler = async (event, _context) => {

    const method = event.requestContext.http.method;
    const phoneNumber = event.queryStringParameters.phoneNumber;

    const existingItem = await getItem(phoneNumber);

    if (method === 'POST' && existingItem) {
        const updatedItem: Donation = {
            name: existingItem.name,
            donations: existingItem.donations,
            phoneNumber: existingItem.phoneNumber
        };

        updatedItem.donations += 1;
        const savedItem = await saveItem(updatedItem);

        await sendText(updatedItem.phoneNumber)
        .catch((error) => console.error('Error:', error));

        return {
            statusCode: 200,
            body: JSON.stringify(savedItem),
        };
    } else if (method === 'POST') {
        return await save(event);
    } else {
        return {statusCode: 400, body: 'Not a valid operation'};
    }  
};

async function sendText(phoneNumber: string) {
    const sns = new SNS();

    await subscribePhoneNumber(TOPIC_ARN, phoneNumber);
  
    const publishParams = {
      Message: MESSAGE,
      PhoneNumber: phoneNumber,
    };
  
    try {
      await sns.publish(publishParams).promise();
      console.log(`Successfully sent a text message to ${phoneNumber}.`);
    } catch (error: any) {
      console.error(`Error sending text message to ${phoneNumber}:`, error);
      throw new Error(`Failed to send text message: ${error.message}`);
    }
  }

async function subscribePhoneNumber(topicArn: string, phoneNumber: string) {
    const sns = new SNS();
    const params = {
        Protocol: 'sms',
        TopicArn: TOPIC_ARN,
        Endpoint: phoneNumber,
    };

    try {
        const subscriptionArn = await sns.subscribe(params).promise();
        console.log(`Successfully subscribed ${phoneNumber} to topic ${topicArn}. Subscription ARN: ${subscriptionArn.SubscriptionArn}`);
    } catch (error: any) {
        console.error(`Error subscribing ${phoneNumber} to topic ${topicArn}:`, error);
        throw new Error(`Failed to subscribe phone number: ${error.message}`);
    }
}

async function save(event: any) {
    const name = event.queryStringParameters.name;
    const phoneNumber = event.queryStringParameters.phoneNumber;
  
    const item = {
      name: name,
      phoneNumber: phoneNumber,
      donations: 1,
    };
  
    const savedItem = await saveItem(item);
  
    return {
      statusCode: 200,
      body: JSON.stringify(savedItem),
    };
  };
  
async function getItem(phoneNumber: string ) {

    if (!phoneNumber) {
        throw {
            statusCode: 400,
            message: "No phone number provided",
        };
    }

    const params : DynamoDB.DocumentClient.GetItemInput = {
        Key: {phoneNumber: phoneNumber},
        TableName: TABLE_NAME,
    };
    
    return dynamo
        .get(params)
        .promise()
        .then((result) => {
            console.log(result);
            return result.Item;
      });
}
  
async function saveItem(item: Donation) {

    const params : DynamoDB.DocumentClient.PutItemInput = {
      TableName: TABLE_NAME,
      Item: item,
    };
  
    return dynamo
      .put(params)
      .promise()
      .then(() => {
        return item;
      });
}