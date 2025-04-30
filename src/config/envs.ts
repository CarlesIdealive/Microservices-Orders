import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    DATABASE_URL: string;
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
}