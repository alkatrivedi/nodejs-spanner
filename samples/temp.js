'use strict';

async function main(
) {
  const {Spanner} = require('../build/src');
  const spanner = new Spanner({
    projectId: 'span-cloud-testing',
  });
  const instance = spanner.instance('alka-testing');
  try {
    const database = instance.database('db-1');
    const queries = [{sql: 'SELECT 1'}, {sql: 'SELECT 2'}, {sql: 'SELECT 3'}];
    const promises = queries.map(async query => {
      const [rows] = await database.run(query);
      console.log(`Query: ${query.sql} returned ${rows.length} rows.`);
      rows.forEach(row => console.log(row));
    });

    await Promise.all(promises);
    
  } catch(e) {
    console.log(e);
  }
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));