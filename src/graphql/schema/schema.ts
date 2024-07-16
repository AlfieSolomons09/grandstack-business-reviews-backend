import { gql } from "apollo-server";


export const graphQLSchema = gql(`
    type Business {
        businessId: ID!
        waitTime: Int! @customResolver
        name: String!
        city: String!
        state: String!
        address: String!
        location: Point!
        reviews: [Review!]! @relationship(type: "REVIEWS", direction: IN)
        categories: [Category!]! @relationship(type: "IN_CATEGORY", direction: OUT)
        averageStars: Float
            # @auth(rules: [{isAuthenticated: true}])
            @cypher(
                statement: """
                    MATCH (this)<-[:REVIEWS]-(r:Review) 
                    RETURN avg(r.stars) AS averageStars
                """,
                columnName: "averageStars"
            )
        recommanded(first: Int = 1): [Business!]!
            @cypher(
                statement: """
                    MATCH (this)<-[:REVIEWS]-(:Review)<-[:WROTE]-(u:User) 
                    MATCH (u)-[:WROTE]->(:Review)-[:REVIEWS]->(rec:Business) 
                    WITH rec, COUNT(*) AS Score 
                    RETURN rec ORDER BY Score DESC LIMIT $first
                """,
                columnName: "rec"
            )
        fuzzyBusinessName(searchString: String): [Business]
            @cypher(
                statement: """
                    CALL {
                        WITH $searchString AS searchString
                        WITH searchString WHERE searchString <> ''
                        CALL db.index.fulltext.queryNodes('businessNameIndex', searchString + '~')
                        YIELD node
                        RETURN collect(node) AS nodes
                        UNION
                        RETURN [] AS nodes
                    }
                    UNWIND nodes AS node
                    RETURN node
                """,
                columnName: "node"
            )
        qualityBusinesses: [Business!]!
            @cypher(
                statement: """
                MATCH (b:Business)<-[:REVIEWS]-(r:Review)
                WITH b, COLLECT(r) AS reviews
                WHERE all(r IN reviews WHERE r.stars > 4.0)
                RETURN b
                """
            )
            # @auth(rules: [{ roles: ["analyst"] }])
    }

    type User {
        userId: ID!
        name: String!
        reviews: [Review!]! @relationship(type: "WROTE", direction: OUT)
    }
    
    type Review {
        reviewId: ID!
        stars: Float!
        date: Date!
        text: String
        user: User @relationship(type: "WROTE", direction: IN)
        business: Business! @relationship(type: "REVIEWS", direction: OUT)
        fuzzyReviewName(searchString: String): [Review]
            @cypher(
                statement: """
                    CALL db.index.fulltext.queryNodes('reviewNameIndex', $searchString+'~')
                    YIELD node RETURN node
                """,
                columnName: "node"
            )
    }
    type Category {
        name: String!
        businesses: [Business!]! @relationship(type: "IN_CATEGORY", direction: IN)
        businessCount: Int
            @cypher(
                statement: """
                    MATCH (this)<-[:IN_CATEGORY]-(b:Business) 
                    RETURN COUNT(b) AS businessCount
                """,
                columnName: "businessCount"
            )
    }

    # extend type User @auth(
    #     rules: [
    #         {roles: ["admin"]}
    #     ]
    # )

    # extend type Review 
    #     @auth(  
    #         rules:[
    #             {
    #                 operations: [CREATE, UPDATE]
    #                 bind: {user: {userId: "$jwt.sub"}}
    #             }
    #         ]
    #     )
`)