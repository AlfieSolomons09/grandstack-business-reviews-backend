import { Neo4jGraphQL } from '@neo4j/graphql';
import { ApolloServer, gql } from 'apollo-server';
import dotenv from 'dotenv';
// import fs from 'fs';
import neo4j from 'neo4j-driver';
// import path from 'path';
import { dirname, generateSchemaFile } from './graphql/intropect.js';
import { resolvers } from './graphql/resolvers/resolvers.js';
import { graphQLSchema } from './graphql/schema/schema.js';
// import { mergeTypeDefs } from '@graphql-tools/merge';
import pkg from '@neo4j/graphql-plugin-auth';
const { Neo4jGraphQLAuthJWKSPlugin } = pkg;

dotenv.config({ path: './.env' });

const driver = neo4j.driver(
    `${process.env.CONNECTION_URL}`,
    neo4j.auth.basic(`${process.env.DATABASE_NAME}`, `${process.env.DATABASE_PASSWORD}`),
);

class CustomNeo4jGraphQLAuthJWKSPlugin extends Neo4jGraphQLAuthJWKSPlugin {
    tryToResolveKeys(req: any): void {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (token) {
            console.log('Token found:', token);
        } else {
            console.log('No token provided');
        }
    }
}

const startServer = async () => {
    try {
        // await generateSchemaFile();

        // const introspectedTypeDefs = fs
        //     .readFileSync(path.join(dirname, "schema.graphql"))
        //     .toString("utf-8");

        // const  mergedTypeDefs = mergeTypeDefs([graphQLSchema, introspectedTypeDefs])

        const neoSchema = new Neo4jGraphQL({ 
            typeDefs: graphQLSchema, 
            resolvers, 
            driver,
            plugins: {
                auth: new CustomNeo4jGraphQLAuthJWKSPlugin({
                    jwksEndpoint: "https://dev-nywym3z4nbfyxrk0.us.auth0.com/.well-known/jwks.json"
                })
            }
        });
        const schema = await neoSchema.getSchema();


        const server = new ApolloServer({
            schema,
            context: ({ req }) => ({
                driver,
                req
            })
        });

        const { url } = await server.listen();
        console.log(`GraphQL server ready at ${url}`);
    } catch (error) {
        console.error('Error starting the server:', error);
    }

    try {
        await driver.verifyConnectivity();
        console.log('Connected to Neo4j');
    } catch (err) {
        console.error('Error connecting to Neo4j:', err);
    }
};

startServer().catch(error => {
    console.error('Unhandled error:', error);
});
