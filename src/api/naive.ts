import { ApolloServer, gql } from "apollo-server";
import jwt from 'jsonwebtoken'

const peopleArray = [
    {
        name: "Bob"
    },
    {
        name: "Lindsey"
    }
]

const typeDefs =gql`
    type Query{
        people: [Person]
    }

    type Person {
        name: String
    }
`

const resolvers = {
    Query: {
        // @ts-ignore 
        people: (obj, arg, context) => {
            if(context.user) {
                return peopleArray
            } else{
                throw new Error ("Authentication failed: Invalid or missing authorization token.");
            }
        }
    }
}

const server = new ApolloServer({
    resolvers,
    typeDefs,
    context: ({req})=>{
        let decoded;
        if(req.headers && req.headers.authorization){
            try {
                decoded = jwt.verify(
                    req.headers.authorization.slice(7),
                    "Dpwm9XXKqk809WXjCsOmRSZQ5i5fXw8N"
                )
            } catch (error) {
                console.log("Invalid token", error)
            }
        }
        return {user: decoded};
    }
})

server.listen().then(({url})=>{
    console.log(`Graphql server ready at ${url}`)
})