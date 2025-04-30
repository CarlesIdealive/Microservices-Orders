import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    DATABASE_URL: string;
    PRODUCTS_MS_HOST: string;
    PRODUCTS_MS_PORT : number;
}
const envsSchema = joi.object({
    PORT: joi
        .number()
        .required()
        .description('Port for the server to listen on'),
    DATABASE_URL: joi
        .string()
        .required()
        .description('Host for the orders microservice'),
    PRODUCTS_MS_HOST: joi
        .string()
        .required()
        .description('Host for the products microservice'),
    PRODUCTS_MS_PORT: joi
        .number()
        .required()
        .description('Port for the products microservice'),
});
const { error, value } = envsSchema.validate(process.env, {
    allowUnknown: true,
    abortEarly: false,
});
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
const envVars : EnvVars = value;
export const envs = {
    port: envVars.PORT,
    dbURL: envVars.DATABASE_URL,
    productsMsHost: envVars.PRODUCTS_MS_HOST,
    productsMsPort: envVars.PRODUCTS_MS_PORT,
}