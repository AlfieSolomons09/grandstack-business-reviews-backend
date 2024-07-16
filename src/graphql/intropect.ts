import { toGraphQLTypeDefs } from '@neo4j/introspector'
import neo4j from 'neo4j-driver'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'

// This file is used to generate Schema with respect to the database already present inside neo4j

dotenv.config({ path: './.env' });

const driver = neo4j.driver(
    "bolt://127.0.0.1:7687",
    neo4j.auth.basic(`${process.env.DATABASE_NAME}`, `${process.env.DATABASE_PASSWORD}`), {
        encrypted: 'ENCRYPTION_OFF'
    }
);

export const __filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(__filename);

const sessionFactory = () =>
    driver.session({ defaultAccessMode: neo4j.session.READ });

export async function generateSchemaFile() {
    try {
        const typeDefs = await toGraphQLTypeDefs(sessionFactory);
        fs.writeFileSync(path.join(dirname, "schema.graphql"), typeDefs);
    } catch (error) {
        console.error('Error generating schema.graphql:', error);
        throw error;
    } finally {
        await driver.close();
    }
}