const buildCrudPaths = (tag, basePath, entityName) => ({
  [basePath]: {
    get: {
      tags: [tag],
      summary: `List ${entityName}`,
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: `${entityName} list returned` },
      },
    },
    post: {
      tags: [tag],
      summary: `Create ${entityName}`,
      security: [{ bearerAuth: [] }],
      requestBody: { $ref: '#/components/requestBodies/GenericJson' },
      responses: {
        201: { description: `${entityName} created` },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  [`${basePath}/{id}`]: {
    get: {
      tags: [tag],
      summary: `Get ${entityName} by id`,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/id' }],
      responses: {
        200: { description: `${entityName} returned` },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
    put: {
      tags: [tag],
      summary: `Update ${entityName}`,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/id' }],
      requestBody: { $ref: '#/components/requestBodies/GenericJson' },
      responses: {
        200: { description: `${entityName} updated` },
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
    delete: {
      tags: [tag],
      summary: `Delete ${entityName}`,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/id' }],
      responses: {
        204: { description: `${entityName} deleted` },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
      },
    },
  },
});

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MilStock Backend API',
    version: '1.0.0',
    description: 'Swagger/OpenAPI documentation for the MilStock inventory, warehouse, requests, supplier, consumption, waste, notifications, and audit APIs.',
  },
  servers: [
    { url: 'http://localhost:5001/api', description: 'Local backend' },
    { url: 'https://milstock.onrender.com/api', description: 'Production backend placeholder' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Warehouses' },
    { name: 'Products' },
    { name: 'Product Warehouses' },
    { name: 'Orders' },
    { name: 'Order Items' },
    { name: 'Movements' },
    { name: 'Consumptions' },
    { name: 'Waste' },
    { name: 'Suppliers' },
    { name: 'Supplier Orders' },
    { name: 'Notifications' },
    { name: 'Audit Logs' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: { description: 'API and database are healthy' },
          503: { description: 'API is running but database is disconnected' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'User registered' },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: {
                email: 'admin@milstock.local',
                password: 'Password123!',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user returned' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    ...buildCrudPaths('Users', '/users', 'users'),
    '/users/{id}/status': {
      patch: {
        tags: ['Users'],
        summary: 'Update user active/inactive status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: {
          200: { description: 'User status updated' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/users/{id}/password': {
      patch: {
        tags: ['Users'],
        summary: 'Reset user password',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: {
          200: { description: 'Password reset' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    ...buildCrudPaths('Warehouses', '/warehouses', 'warehouses'),
    '/warehouses/{id}/dashboard': {
      get: {
        tags: ['Warehouses'],
        summary: 'Get warehouse-specific dashboard',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          200: { description: 'Warehouse dashboard returned' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    ...buildCrudPaths('Products', '/products', 'products'),
    '/products/{id}/alert-settings': {
      get: {
        tags: ['Products'],
        summary: 'Get product alert thresholds',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: { 200: { description: 'Alert settings returned' } },
      },
      patch: {
        tags: ['Products'],
        summary: 'Update product alert thresholds',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductAlertSettings' },
            },
          },
        },
        responses: {
          200: { description: 'Alert settings updated' },
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    ...buildCrudPaths('Product Warehouses', '/product-warehouses', 'product warehouse stock rows'),
    ...buildCrudPaths('Orders', '/orders', 'orders'),
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Admin updates order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: { 200: { description: 'Order status updated' } },
      },
    },
    '/orders/{id}/admin-decision': {
      patch: {
        tags: ['Orders'],
        summary: 'Admin approve/reject warehouse request',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision'],
                properties: {
                  decision: { type: 'string', enum: ['approve', 'reject'] },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Admin decision applied' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/orders/{id}/status-logs': {
      get: {
        tags: ['Orders'],
        summary: 'Get order status logs',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: { 200: { description: 'Status logs returned' } },
      },
    },
    ...buildCrudPaths('Order Items', '/order-items', 'order items'),
    ...buildCrudPaths('Movements', '/movements', 'movement logs'),
    '/movements/complete-transfer/{orderId}': {
      patch: {
        tags: ['Movements'],
        summary: 'Complete approved warehouse transfer from Movement Logs',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: {
          200: { description: 'Transfer completed' },
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    ...buildCrudPaths('Consumptions', '/consumptions', 'consumptions'),
    '/consumptions/my': {
      get: {
        tags: ['Consumptions'],
        summary: 'Get consumptions for current user warehouse',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'My consumptions returned' } },
      },
    },
    '/consumptions/{id}/cancel': {
      patch: {
        tags: ['Consumptions'],
        summary: 'Cancel a consumption and restore stock',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: { 200: { description: 'Consumption cancelled' } },
      },
    },
    '/waste': {
      get: {
        tags: ['Waste'],
        summary: 'List waste records',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Waste records returned' } },
      },
      post: {
        tags: ['Waste'],
        summary: 'Create waste record',
        security: [{ bearerAuth: [] }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: { 201: { description: 'Waste record created' } },
      },
    },
    '/waste/analytics': {
      get: {
        tags: ['Waste'],
        summary: 'Get waste analytics chart data',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Waste analytics returned' } },
      },
    },
    ...buildCrudPaths('Suppliers', '/suppliers', 'suppliers'),
    '/suppliers/users': {
      get: {
        tags: ['Suppliers'],
        summary: 'List active supplier users',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Supplier users returned' } },
      },
    },
    '/supplier/orders': {
      get: {
        tags: ['Supplier Orders'],
        summary: 'Supplier lists own orders',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Supplier orders returned' } },
      },
    },
    '/supplier/orders/{id}': {
      get: {
        tags: ['Supplier Orders'],
        summary: 'Supplier gets own order',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: { 200: { description: 'Supplier order returned' } },
      },
    },
    '/supplier/orders/{id}/status': {
      patch: {
        tags: ['Supplier Orders'],
        summary: 'Supplier updates assigned order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: { 200: { description: 'Supplier order status updated' } },
      },
    },
    ...buildCrudPaths('Notifications', '/notifications', 'notifications'),
    '/notifications/expiration/check': {
      get: {
        tags: ['Notifications'],
        summary: 'Generate/check expiration notifications',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Expiration notifications returned' } },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notifications marked as read' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark one notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: { 200: { description: 'Notification marked as read' } },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'List audit logs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Audit logs returned' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Audit Logs'],
        summary: 'Create frontend audit log',
        security: [{ bearerAuth: [] }],
        requestBody: { $ref: '#/components/requestBodies/GenericJson' },
        responses: { 201: { description: 'Audit log created' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        example: '64f000000000000000000001',
      },
    },
    requestBodies: {
      GenericJson: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    responses: {
      BadRequest: { description: 'Bad request or validation error' },
      Unauthorized: { description: 'Missing or invalid JWT token' },
      Forbidden: { description: 'Role is not allowed to access this resource' },
      NotFound: { description: 'Resource not found' },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'unit', 'supplier'] },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'unit', 'supplier'] },
          status: { type: 'string' },
          assigned_warehouse: { type: 'string', nullable: true },
        },
      },
      ProductAlertSettings: {
        type: 'object',
        properties: {
          low_stock_threshold: { type: 'number', minimum: 0 },
          critical_stock_threshold: { type: 'number', minimum: 0 },
          expiration_warning_days: { type: 'number', minimum: 0 },
          critical_expiration_days: { type: 'number', minimum: 0 },
        },
      },
    },
  },
};

const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MilStock API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f7f8f3; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
      });
    </script>
  </body>
</html>`;

const setupSwagger = (app) => {
  app.get('/api-docs.json', (_req, res) => {
    res.json(openApiSpec);
  });

  app.get('/docs', (_req, res) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https://unpkg.com; connect-src 'self'"
    );
    res.type('html').send(swaggerHtml);
  });
};

module.exports = {
  openApiSpec,
  setupSwagger,
};
