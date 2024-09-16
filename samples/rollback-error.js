'use-strict';
async function main(instanceId, databaseId, projectId) {

    async function deleteData() {
        // [START spanner_delete_data]
        // Imports the Google Cloud client library
        const {Spanner} = require('../build/src');
      
        /**
         * TODO(developer): Uncomment the following lines before running the sample.
         */
        // const projectId = 'my-project-id';
        // const instanceId = 'my-instance';
        // const databaseId = 'my-database';
      
        // Creates a client
        const spanner = new Spanner({
          projectId: projectId,
        });
      
        // Gets a reference to a Cloud Spanner instance and database
        const instance = spanner.instance(instanceId);
        const database = instance.database(databaseId);
      
        // Delete a range of rows where the column key is >=3 and <5
        const promise = await database.getTransaction();
        const transaction = promise[0];
        transaction.rollback((err, res)=>{
            if(err) {
                console.log("ERROR: ", err);
            } else {
                console.log("RESPONSE: ", res);
            }
        });
        // [END spanner_delete_data]
    }
    deleteData();
}

process.on('unhandledRejection', err => {
    console.error(err.message);
    process.exitCode = 1;
});
main(...process.argv.slice(2));