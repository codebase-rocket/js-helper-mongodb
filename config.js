// Info: Configuration file
'use strict';


// Export configration as key-value Map
module.exports = {

  // Database Details
  PROTOCOL: 'mongodb+srv', // Connection Protocol. mongodb+srv or mongodb
  HOST: '', // Host address of the MongoDB server, including the port. Ex: cluster0.example.mongodb.net
  USER: '', // Username for the MongoDB database
  PASS: '', // Password for the MongoDB database
  DATABASE: '', // Name of the MongoDB database

  // Config for Outgoing HTTP requests to Host server
  MAX_RETRIES: 2,
  TIMEOUT: 5000, // Request timeout in 5 seconds

  // Enable Convertion of Object type index to MongoDb's single-key type index
  INDEX_ENABLE_OBJECT: false,
  INDEX_PARTITION_KEY: null, // Partition Key 'p'
  INDEX_SORT_KEY: null, // Sort Key 's'
  INDEX_SEPARATOR_CHAR: null, // Join Partition and Sort values with separator character 'partition_value#sort_value'
  SKIP_SAVING_INDEX_KEYS: false, // Do not save partition-key and sort-key in record. Avoid turning it on unless none of the seconday-indexs are dependendent on either of index keys

}
