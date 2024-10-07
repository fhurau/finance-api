const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
module.exports.register = async (event) => {
    try {
      const { username, password } = JSON.parse(event.body);
  
      // Validate input
      if (!username || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Username and password are required.' }),
        };
      }
  
      // Check if the user already exists
      const params = {
        TableName: process.env.USERS_TABLE,
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username,
        },
        IndexName: 'UsernameIndex',
      };
  
      const result = await dynamoDb.query(params).promise();
  
      if (result.Count > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Username already exists.' }),
        };
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const user = {
        userId: uuidv4(),
        username,
        password: hashedPassword,
      };
  
      // Save the user to DynamoDB
      const putParams = {
        TableName: process.env.USERS_TABLE,
        Item: user,
      };
  
      await dynamoDb.put(putParams).promise();
  
      // Generate JWT Token
      const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      return {
        statusCode: 201,
        body: JSON.stringify({ token }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error' }),
      };
    }
  };

  module.exports.login = async (event) => {
    try {
      const { username, password } = JSON.parse(event.body);
  
      // Validate input
      if (!username || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Username and password are required.' }),
        };
      }
  
      // Get the user from DynamoDB
      const params = {
        TableName: process.env.USERS_TABLE,
        IndexName: 'UsernameIndex',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username,
        },
      };
  
      const result = await dynamoDb.query(params).promise();
  
      if (result.Count === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid username or password.' }),
        };
      }
  
      const user = result.Items[0];
  
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid username or password.' }),
        };
      }
  
      // Generate JWT Token
      const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      return {
        statusCode: 200,
        body: JSON.stringify({ token }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error' }),
      };
    }
  };
  
  