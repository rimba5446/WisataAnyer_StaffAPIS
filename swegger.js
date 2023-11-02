const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Staff APIS ',
      version: '1.0.0 ouroVoros',
      description: 'API documentation for Your API',
    },
    servers: [
      {
        url: 'https://harvest-heaven-staffapi.glitch.me', 
        description: 'Local Development',
      },
    ],
  },
  apis: ['./index.js'], 
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
