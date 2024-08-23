'use strict';

async function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
    
  const isMultiplexedSessionEnabled = true;
  const {Spanner} = require('../build/src');
  const spanner = new Spanner({
    isMultiplexedSessionEnabled: isMultiplexedSessionEnabled,
    projectId: projectId,
  });
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

    // Define multiple queries
    const queries = [
        { sql: 'SELECT 1' },
        { sql: 'SELECT 2' },
        { sql: 'SELECT 3' }
    ];
  
    // Function to execute queries concurrently
    async function runQueriesConcurrently() {
        // await database.run('SELECT 1');
        const promises = queries.map(async query => {
            const [rows] = await database.run(query);
            console.log(`Query: ${query.sql} returned ${rows.length} rows.`);
            rows.forEach(row => console.log(row));
        });
    
        await Promise.all(promises);
    }
  
  // Run the queries
  runQueriesConcurrently().catch(console.error);

//   try {

//     // The query to execute
//     // const query = {
//     //     sql: 'SELECT 1',
//     // };

//     // Execute a simple SQL statement
//     // const [rows] = await database.run(query);
//     // console.log(`Query: ${rows.length} found.`);
//     // rows.forEach(row => console.log(row));
//     // console.log(await database.createMultiplexedSession());
//     const queries = [
//         {sql: 'SELECT 1'},
//         {sql: 'SELECT 1'},
//         {sql: 'SELECT 1'}
//     ];
//     // const results = await Promise.all(queries.map(async (query) => {
//     //     const [rows] = await database.run({ query });
//     //     return rows;
//     // }));
//     queries.map(async (query) => {
//         const [rows] = await database.run({ query });
//         console.log(rows);
//     })

//     // console.log(await database.run({ query: 'SELECT 1'}));
//     // const [rows] = await database.run({ query: 'SELECT 1'});
//     // console.log(rows);

//     // Process results
//     // results.forEach((rows, index) => {
//     //     console.log(`Results for query ${index + 1}:`);
//     //     rows.forEach(row => {
//     //         console.log(row.toJSON());
//     //     });
//     // });
//   } catch (err) {
//     console.log(err);
//   } finally {
//     await database.close();
//   }
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));