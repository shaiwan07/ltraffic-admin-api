const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LTraffic Admin API',
      version: '1.0.0',
      description:
        'REST API for the LTraffic Limited Admin Panel. ' +
        'Handles admin authentication, incidents, vehicle checks, timesheets, bulletins, ' +
        'HR manager, equipment register, document control, and user management.',
      contact: { name: 'LTraffic Limited', email: 'al@ltraffic.co.uk' },
    },
    servers: [
      { url: 'http://localhost:4000/api', description: 'Development' },
      { url: 'https://ltraffic.co.uk/admin-api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        AdminUser: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            level: { type: 'integer', description: '1=Admin, 4=Admin1, 7=Admin2, 8=Essex Supervisor' },
            level_name: { type: 'string' },
            ltrafficid: { type: 'string' },
            team: { type: 'string' },
          },
        },
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            status: { type: 'string', enum: ['Open', 'Closed'] },
            operativesname: { type: 'string' },
            type: { type: 'string' },
            location: { type: 'string' },
            reportedby: { type: 'string' },
            report: { type: 'string' },
            arrival_datetime: { type: 'string' },
            confirmed: { type: 'integer' },
          },
        },
        VehicleCheck: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            drivername: { type: 'string' },
            vehiclereg: { type: 'string' },
            mileage: { type: 'integer' },
            arrival_datetime: { type: 'string' },
            vehiclecondition: { type: 'string' },
            safe: { type: 'string' },
            confirmed: { type: 'integer' },
          },
        },
        Timesheet: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            status: { type: 'string', enum: ['Draft', 'Submitted', 'Approved', 'Rejected'] },
            name: { type: 'string' },
            ltrafficid: { type: 'string' },
            week: { type: 'string' },
          },
        },
        Bulletin: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            ref: { type: 'string' },
            description: { type: 'string' },
            image: { type: 'string' },
            image_url: { type: 'string' },
            download: { type: 'string' },
            download_url: { type: 'string' },
            arrival_datetime: { type: 'string' },
            new: { type: 'integer', description: '1=Active, 0=Inactive' },
          },
        },
        Equipment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            item: { type: 'string' },
            description: { type: 'string' },
            ident: { type: 'string' },
            allocatedto: { type: 'string' },
            date: { type: 'string' },
            cond: { type: 'string' },
            expiry: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            username: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            user_level: { type: 'string' },
            ltrafficid: { type: 'string' },
            team: { type: 'string' },
            vehiclereg: { type: 'string' },
            restricted: { type: 'integer' },
            onboarding: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
