const AWS = require('aws-sdk');
const { authorize } = require('../middlewares/authorize');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.createAccount = authorize(async (event) => {
  const userId = event.user.userId;
  const { accountName, initialBalance } = JSON.parse(event.body);

  // Input validation
  if (!accountName || initialBalance === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Account name and initial balance are required.' }),
    };
  }

  // Create account object
  const account = {
    accountId: uuidv4(),
    userId,
    accountName,
    balance: initialBalance,
    createdAt: new Date().toISOString(),
  };

  // Save account to DynamoDB
  const params = {
    TableName: process.env.ACCOUNTS_TABLE,
    Item: account,
  };

  try {
    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Account created successfully',
        accountId: account.accountId,
      }),
    };
  } catch (error) {
    console.error('Error creating account:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not create account' }),
    };
  }
});
