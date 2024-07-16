import neo4j from 'neo4j-driver'
(async () => {
    const uri = "neo4j+s://b34c4c11.databases.neo4j.io"
    const user = "neo4j"
    const password = "graphqlapi"


    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        const readQuery = `MATCH (n) RETURN COUNT(n) AS num`;

        const readResult = await session.executeRead(tx=>tx.run(readQuery))

        readResult.records.forEach((record)=>{
            console.log(`Found ${record.get("num")} nodes in the database`)
        })

    } catch (error) {
        console.error("Something went wrong", error)
    } finally{
        await session.close()
    }
})();