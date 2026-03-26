import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VisOps Code Scanning API Documentation",
      version: "1.0.0",
      description: "Detailed documentation for the VisOps-CodeScanning API.",
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  // Path to the API docs
  apis: ["./app/api/**/*.ts"],
};

export const getApiDocs = () => {
  const spec = swaggerJsdoc(options);
  return spec;
};
