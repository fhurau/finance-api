const jwt = require('jsonwebtoken');

module.exports.authorize = (handler) => {
  return async (event, context) => {
    const token = event.headers.Authorization || event.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    try {
      const decoded = jwt.verify(token.slice(7), process.env.JWT_SECRET);
      event.user = decoded;
      return handler(event, context);
    } catch (error) {
      console.error('Authorization error:', error);
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid or expired token' }),
      };
    }
  };
};
