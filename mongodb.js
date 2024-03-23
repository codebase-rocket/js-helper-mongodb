// Info: Boilerplate library. Connects to No-Sql Database. Contains Wraper Functions for MongoDB functions
'use strict';

// Shared Dependencies (Managed by Loader)
let Lib = {};

// MongoDB Package
const { MongoClient } = require('mongodb');

// Exclusive Dependencies
let CONFIG = require('./config'); // Loader can override it with Custom-Config


/////////////////////////// Module-Loader START ////////////////////////////////

  /********************************************************************
  Load dependencies and configurations

  @param {Set} shared_libs - Reference to libraries already loaded in memory by other modules
  @param {Set} config - Custom configuration in key-value pairs

  @return nothing
  *********************************************************************/
  const loader = function(shared_libs, config){

    // Shared Dependencies (Must be loaded in memory already)
    Lib.Utils = shared_libs.Utils;
    Lib.Debug = shared_libs.Debug;
    Lib.Instance = shared_libs.Instance;

    // Override default configuration
    if( !Lib.Utils.isNullOrUndefined(config) ){
      Object.assign(CONFIG, config); // Merge custom configuration with defaults
    }

  };

//////////////////////////// Module-Loader END /////////////////////////////////



///////////////////////////// Module Exports START /////////////////////////////
module.exports = function(shared_libs, config){

  // Run Loader
  loader(shared_libs, config);

  // Return Public Funtions of this module
  return NoDB;

};//////////////////////////// Module Exports END //////////////////////////////



///////////////////////////Public Functions START///////////////////////////////
const NoDB = { // Public functions accessible by other modules

  /********************************************************************
  Service-Param Builder for add-record

  @param {String} collection_name - Collection in which new entry is to be created
  @param {Set} data - JSON to be saved

  @return {set} service_params - Service Params for MongoDB API
  *********************************************************************/
  commandBuilderForAddRecord: function(collection_name, data){

    // Converts the given 'id' (which can be an object or a string) into a formatted index string
    const index_value = _NoDB.formatIndexStringFromData(data);

    // Remove partition and sort key from data
    data = _NoDB.removeIndexObjectKeysFromData(data);

    // Service Params
    var service_params = {
      'collection_name': collection_name,
      'filter': { '_id': index_value }, // Index Key
      'data': data,
      'options': { upsert: true } // Enable add or replace
    };


    // Return Service-Params
    return service_params;

  },


  /********************************************************************
  Add new entry to No-sql database (Using Pre-Built Command Object)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Set} service_params - Command-Obj for record to be added

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful add-record or update-record
  * @callback {Boolean} is_success - false if no record was added or updated
  *********************************************************************/
  commandAddRecord: function(instance, cb, service_params){

    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);

    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);


    // Replace the document if it exists, insert it if it does not
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Add Record', instance['time_ms']);
    collection.replaceOne(service_params.filter, service_params.data, service_params.options)

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Add Record', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        // Success saving record
        if( response.modifiedCount === 1 || response.upsertedCount === 1 ){
          cb(null, true); // Record successfully added or replaced
        }
        else {
          cb(null, false); // No changes made
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Add Record' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Add new entry to No-sql database

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} collection_name - Collection in which new entry is to be created
  @param {Set} data - JSON to be saved

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful add-record or update-record
  * @callback {Boolean} is_success - false if no record was added or updated
  *********************************************************************/
  addRecord: function(instance, cb, collection_name, data){

    // Service Params
    var service_params = NoDB.commandBuilderForAddRecord(
      collection_name, data
    );


    // Add entry in MongoDB
    NoDB.commandAddRecord(instance, cb, service_params);

  },


  /********************************************************************
  Add multiple new entries to MongoDB database
  MongoDB only allows bulk write to one collection at a time, so internally iterates all the collections

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String[]} collection_names - Collections in which new entries are to be created
  @param {Set[][]} data_items - JSON entries to be saved

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful add-record
  * @callback {Boolean} is_success - false on unsuccessful add-record or error
  *********************************************************************/
  addBatchRecords: function(instance, cb, collection_names, data_items){

    // ~Sample Input~
    // table_name = [ collection1, collection2, collection3 ]
    // data_items = [ [{collection1_data1},{collection1_data2}], [{collection2_data1}], [{collection3_data1},{collection3_data2}] ]


    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);


    // Create Bulk replace or insert statement for each record of first collection
    let bulk_operations = data_items[0].map(function(data){

      // Converts the given 'id' (which can be an object or a string) into a formatted index string
      const index_value = _NoDB.formatIndexStringFromData(data);

      // Remove partition and sort key from data
      data = _NoDB.removeIndexObjectKeysFromData(data);

      // Create Service Params for replace or insert statement
      return {
        'replaceOne': {
          'filter': { _id: index_value },
          'replacement': data,
          'upsert': true
        }
      };

    });

    // Select first collection as Current Collection. MongoDB's bulkWrite can operate on a single collection at a time.
    const collection_name = collection_names[0];
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(collection_name);


    // Perform the bulk operations
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Add Batch Records', instance['time_ms']);
    collection.bulkWrite(bulk_operations, { ordered: false })

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Add Batch Records', instance['time_ms']);

        // If more collections remaining, recursive call to same function with remaining collections
        if( collection_names.length > 1 ){

          NoDB.addBatchRecords(
            instance, cb,
            collection_names.slice(1), // Remove first collection from list of collections
            data_items.slice(1) // Remove this collection's data from data list
          );

        }

        // All good. All Records Successfully added
        else {
          cb(null, true);
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Add Batch Records' +
          '\nparams: ' + JSON.stringify(bulk_operations)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Service-Param Builder for 'Delete'

  @param {String} collection_name - Collection from which record is to be removed
  @param {String} id - Partition key + Sort key of record to be deleted

  @return {set} service_params - Service Params for MongoDB API
  *********************************************************************/
  commandBuilderForDeleteRecord: function(collection_name, id){

    // Converts the given 'id' (which can be an object or a string) into a formatted index string
    const index_value = _NoDB.formatIndexStringFromData(id);

    // Service Params
    var service_params = {
      'collection_name': collection_name,
      'filter': { '_id': index_value }, // Index Key
    };


    // Return Service-Params
    return service_params;

  },


  /********************************************************************
  Delete entry from No-sql database (Using Pre-Built Command Object)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Set} service_params - Command-Obj for record to be removed

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful delete-record
  * @callback {Boolean} is_success - false on record not found to be deleted
  *********************************************************************/
  commandDeleteRecord: function(instance, cb, service_params){

    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);

    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);


    // Delete the record if it exists
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Delete Record', instance['time_ms']);
    collection.deleteOne(service_params.filter)

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Delete Record', instance['time_ms']);

        // Success deleting record
        if( response.deletedCount === 1 ){
          cb(null, true); // Record successfully deleted
        }
        else {
          cb(null, false); // No record deleted
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Delete Record' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Delete entry from No-sql database

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} collection_name - Collection from which record is to be removed
  @param {String} id - Partition key + Sort key of record to be deleted

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful delete-record
  * @callback {Boolean} is_success - false on record not found to be deleted
  *********************************************************************/
  deleteRecord: function(instance, cb, collection_name, id){

    // Service Params
    var service_params = NoDB.commandBuilderForDeleteRecord(
      collection_name, id
    );


    // Remove entry in MongoDB
    NoDB.commandDeleteRecord(instance, cb, service_params);

  },


  /********************************************************************
  Delete multiple records to MongoDB database
  MongoDB only allows bulk write to one collection at a time, so internally iterates all the collections

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String[]} collection_names - Collections from which records are to be deleted
  @param {String[][]} ids - Array of ids of Partition key + Sort key of records to be deleted

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful delete-record
  * @callback {Boolean} is_success - false on unsuccessful delete-record or error
  *********************************************************************/
  deleteBatchRecords: function(instance, cb, collection_names, ids){

    // ~Sample Input~
    // table_name = [ table1, table2, table3 ]
    // ids = [ [table1_id1,table1_id2], [table2_id1], [table3_id1,table3_id2] ]


    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);


    // Create delete statement for each record of first collection
    let bulk_operations = ids[0].map(function(id){

      // Converts the given 'id' (which can be an object or a string) into a formatted index string
      const index_value = _NoDB.formatIndexStringFromData(id);

      // Create Service Params for replace or insert statement
      return {
        'deleteOne': {
          'filter': { '_id': index_value }
        }
      }

    });

    // Select first collection as Current Collection. MongoDB's bulkWrite can operate on a single collection at a time.
    const collection_name = collection_names[0];
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(collection_name);


    // Perform the bulk operations
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Delete Batch Records', instance['time_ms']);
    collection.bulkWrite(bulk_operations, { ordered: false })

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Delete Batch Records', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        // If more collections remaining, recursive call to same function with remaining collections
        if( collection_names.length > 1 ){
          NoDB.deleteBatchRecords(
            instance, cb,
            collection_names.slice(1), // Remove first collection from list of collections
            ids.slice(1) // Remove this collection's data from ids list
          );
        }

        // All records processed
        else {
          cb(null, true); // All good. All Records Successfully deleted
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Delete Batch Records' +
          '\nparams: ' + JSON.stringify(bulk_operations)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Service-Param Builder for 'Update'

  @param {String} collection_name - Table in which new entry is to be created
  @param {Set|String} id - Partition key + Sort key of record to be modified
  @param {Set} [update_data] - (Optional) Data to be updated against above id
  @param {String[]} [remove_keys] - (Optional) List of Keys to be removed
  @param {Set} [increment] - (Optional) List of Keys whose value is to increased
  * @param {String} [key] - Key-Name whose value is to be incremented
  * @param {Number} [value] - Number to be added to original Key-Value
  @param {Set} [decrement] - (Optional) List of Keys whose value is to decreased
  * @param {String} [key] - Key-Name whose value is to be decremented
  * @param {Number} [value] - Number to be added to original Key-Value
  @param {String} [return_state] - (Optional) Retrieve which form of updated object. Enum ( 'ALL_NEW' | 'UPDATED_NEW' | 'ALL_OLD' - Default )
  @param {Boolean} [no_upsert] - (Optional) Do not insert if record doesn't exist.

  @return {set} service_params - Service Params for MongoDB API
  *********************************************************************/
  commandBuilderForUpdateRecord: function(
    collection_name, id,
    update_data, remove_keys,
    increment, decrement,
    return_state,
    no_upsert = false
  ){

    // Converts the given 'id' (which can be an object or a string) into a formatted index string
    const index_value = _NoDB.formatIndexStringFromData(id);

    // Service Params
    var service_params = {
      'collection_name': collection_name,
      'filter': { '_id': index_value }, // Index Key
      'updates': {}, // Initialize
      'options': {  // Initialize
        'upsert': no_upsert ? false : true // Creates a new record if it doesn't exist, only if no-upsert is false
      }
    };


    // Build statement for updated data
    if(update_data){

      // Remove partition and sort key from data
      update_data = _NoDB.removeIndexObjectKeysFromData(update_data);

      // Update statement
      service_params.updates['$set'] = update_data;

    }


    // Build statement for removing data keys
    if( !Lib.Utils.isEmpty(remove_keys) ){ // Only if not empty Array

      // Convert each key to object {'key1':''}
      service_params.updates['$unset'] = {};
      remove_keys.forEach(function(key){
        service_params.updates['$unset'][key] = '';
      });

    }


    // Iterate all keys to be 'Incremented'
    if( !Lib.Utils.isEmpty(increment) ){ // Only if not empty Array
      service_params.updates['$inc'] = {...increment}; // {'score':10, 'age':20}
    }

    // Iterate all keys to be 'Decremented'
    if( !Lib.Utils.isEmpty(decrement) ){ // Only if not empty Array

      // If increment set is already present, then append decrement key to it
      if( !Lib.Utils.isEmpty(service_params.updates['$inc']) ){
        service_params.updates['$inc'] = { ...service_params.updates['$inc'], ..._NoDB.convertToNegative(decrement) };
      }
      else{
        service_params.updates['$inc'] = { ..._NoDB.convertToNegative(decrement) }; // {'age':-1}
      }

    }


    // Set options whether to return the updated document or original document
    if(return_state === 'ALL_NEW' || return_state === 'UPDATED_NEW'){
      service_params.options['returnDocument'] = 'after'; // Return the updated document
    }
    else {
      service_params.options['returnDocument'] = 'before' // Return the original document by default
    }


    // Return Service-Params
    return service_params;

  },


  /********************************************************************
  Update an existing entry in No-sql database (Using Pre-Built Command Object)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Set} service_params - Command-Obj for record to be updated

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Set} response - Updated record json on success
  *********************************************************************/
  commandUpdateRecord: function(instance, cb, service_params){

    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);

    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);


    // Update the Record
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Update Record', instance['time_ms']);
    collection.findOneAndUpdate(service_params.filter, service_params.updates, service_params.options)

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Update Record', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        // Appends index keys (partition-key and sort-key) to the response data
        response = _NoDB.appendIndexObjectKeysFromData(response);

        // Return the record, or null if no document matched
        cb(null, response);

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Update Record' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Update an existing entry in No-sql database

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} collection_name - Table in which new entry is to be created
  @param {Set} id - Partition key + Sort key of record to be modified
  @param {Set} [update_data] - (Optional) Data to be updated against above id
  @param {String[]} [remove_keys] - (Optional) List of Keys to be removed
  @param {Set} [increment] - (Optional) List of Keys whose value is to increased
  * @param {String} [key] - Key-Name whose value is to be incremented
  * @param {Number} [value] - Number to be added to original Key-Value
  @param {Set} [decrement] - (Optional) List of Keys whose value is to decreased
  * @param {String} [key] - Key-Name whose value is to be decremented
  * @param {Number} [value] - Number to be added to original Key-Value
  @param {String} [return_state] - (Optional) Retrieve which form of updated object. Enum ( 'ALL_NEW' | 'ALL_OLD' - Default )
  @param {Boolean} [no_upsert] - (Optional) Do not insert if record doesn't exist.

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Set} response - Updated record json on success
  *********************************************************************/
  updateRecord: function(
    instance, cb,
    collection_name, id,
    update_data, remove_keys,
    increment, decrement,
    return_state,
    no_upsert = false
  ){

    // Service Params
    var service_params = NoDB.commandBuilderForUpdateRecord(
      collection_name, id,
      update_data, remove_keys,
      increment, decrement,
      return_state,
      no_upsert
    );


    // Update entry in MongoDB
    NoDB.commandUpdateRecord(instance, cb, service_params);

  },


  /********************************************************************
  No-sql get Single record for particular Index key

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} table_name - Table from wich record is to be fetched
  @param {Set|String} id - Partition key + Sort key of record to be fetched

  @return Thru request Callback.

  @callback - Request Callback(err, response)
  * @callback {Error} err - In case of error
  * @callback {Set} response - record json on success
  * @callback {Boolean} response - false if record not found or error
  *********************************************************************/
  getRecord: function(instance, cb, collection_name, id){

    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);


    // Converts the given 'id' (which can be an object or a string) into a formatted index string
    const index_value = _NoDB.formatIndexStringFromData(id);

    // Service Params
    var service_params = {
      'collection_name': collection_name,
      'filter': { '_id': index_value } // Index Key
    };


    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);

    // Get the Record
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Get Record', instance['time_ms']);
    collection.findOne(service_params.filter)

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Get Record', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        if(response){

          // Appends index keys (partition-key and sort-key) to the response data
          response = _NoDB.appendIndexObjectKeysFromData(response);

          // Return Record
          cb(null, response);

        }
        else {
          cb(null, false); // No record found
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Get Record' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Get multiple records from MongoDB database
  MongoDB only allows bulk get from one collection at a time, so internally iterates all the collections

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Array} collection_names - Array of Collections from which records are to fetched
  @param {Set|String[][]} ids - Array of ids of Partition key + Sort key of records to be fetched
  @param {Boolean} [is_secondary_index] - If Record needs to be fetched on secondary-index
  @param {Set} [result_chain] - (Optional) To overcome AWS limits, recursive call to this function with carry over results

  @return Thru request Callback.

  @callback - Request Callback(err, response)
  * @callback {Error} err - In case of error
  * @callback {Boolean} response - record json on success
  *********************************************************************/
  getBatchRecords: function(
    instance, cb,
    collection_names, ids,
    is_secondary_index,
    result_chain = {}
  ){

    // ~Sample Input~
    // table_name = [ table1, table2, table3 ]
    // data_items = [ [{table1_id1},{table1_id2}], [{table2_id1}], [{table3_bad_id1},{table3_bad_id2}] ]

    // ~Sample Output~
    // {table1: [result_for_id1, result_for_id2], table2: [result_for_id1], table3: [] }


    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);


    // Service Params
    var service_params = {
      'collection_name': collection_names[0], // Select first collection as Current Collection. MongoDB's bulkWrite can operate on a single collection at a time.
    };


    // If data is to be fetched on secondary-index, then do not transform index-object into string
    if(is_secondary_index){ // todo: Only working for Set based keys for now

      // Case 1: Only One Key is sent as ID. Ex: [{some_id:'a'}, {some_id:'b'}]
      if( Object.keys(ids[0][0]).length == 1 ){

        // Get index_key name (assume first key of first ID object as the index key)
        const index_key = Object.keys(ids[0][0])[0];

        // Create array of all the ID values [{some_id:'a'}, {some_id:'b'}] => ['a', 'b']
        const index_values = ids[0].map(function(id){
          return id[index_key];
        });

        // Set filter in service-params
        service_params['filter'] = { [index_key]: { $in: index_values } } // Index Key
      }

      // Case 2: Todo: More then one key is id

    }

    // If Primary Index, then transform index-object as per the logic
    else {

      // Converts the given 'id' (which can be an object or a string) into a formatted index string
      const index_values = ids[0].map(function(id){  // Iterate all 'ids' array of first collection
        return _NoDB.formatIndexStringFromData( id );
      });

      // Set filter in service-params
      service_params['filter'] = { '_id': { $in: index_values } } // Index Keys

    }


    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);

    // Perform the multiple get
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Get Batch Records', instance['time_ms']);
    collection.find(service_params.filter).toArray()

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Get Batch Records', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        // Copy results to result-chain
        if( !Lib.Utils.isEmpty(response) ){

          // Appends index keys (partition-key and sort-key) to the data in responses
          response = response.map(function(data){
            return _NoDB.appendIndexObjectKeysFromData(data);
          });

          // Response
          result_chain[service_params.collection_name] = response;

        }
        else {
          result_chain[service_params.collection_name] = []; // No Results
        }

        // If more collections remaining, recursive call to same function with remaining collections
        if( collection_names.length > 1 ){
          NoDB.getBatchRecords(
            instance, cb,
            collection_names.slice(1), // Remove first collection from list of collections
            ids.slice(1), // Remove this collection's data from ids list
            is_secondary_index, // Forward
            result_chain // Forward
          );
        }

        // All records fetched
        else {
          cb(null, result_chain); // Return all records
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Get Batch Records' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  Service-Param Builder for 'Update' and 'Count'

  @param {String} collection_name - Table in which new entry is to be created
  @param {String} [secondary_index] - Not applicable for MongoDB. Directly works on ID-Key
  @param {String} [id_key] - Partition-key name of secondary-index. null for '_id' as default primary-index
  @param {String} [id_value] - Partition-Key Value. Null to get all records of table, or null for non-set records
  @param {String} [fields_list] - (Optional) Retrieve only particular feilds value. send null to get all feilds
  @param {String} [paging] - (Optional) Start and Limit for pagination
  * @param {Number} [paging.start] - (Optional) Number of records to skip (Send undefined in case no starting pointer)
  * @param {Number} [paging.limit] - Number of records to be fetched (Default Limit 100)
  @param {String} [condition] - (Optional) Additional condition on sort key
  * @param {String} [condition.operator] - (Optional) Special comparison operator '=' | '<=' | '<' | '>=' | '>' | 'begins_with' | 'between'
  * @param {String} condition.key - sort key on which comparison is to be done
  * @param {Integer|String} condition.value - sort key value for comparison
  * @param {Integer|String} condition.value2 - sort key second value for comparison (Only in case of 'between' operator) (including this value if exact-match, else excluding this value if string starts-with)
  * @param {Boolean} condition.asc - (Optional) True means get results in Ascending order. Default in Decending order

  @return {set} service_params - Service Params for MongoDB API
  *********************************************************************/
  commandBuilderForQueryRecords: function(
    collection_name, secondary_index, id_key = '_id', id_value,
    fields_list, paging, condition
  ){

    // Override partition-key name with '_id', in case of Primary-Index
    if( Lib.Utils.isNullOrUndefined(secondary_index) ){ // Is primary Index. Not a Secondary index
      id_key = '_id'; // Override partition-key name with '_id'
    }


    // Service Params
    var service_params = {
      'collection_name': collection_name,
      'filter': {}, // Initialize - Index Key
      'options': {} // Initialize
    };


    // Order-by key (Whether to choose partition-key or sort-key for ordering the results)
    var order_by_key = id_key;


    // Build Query Filter for Secondary-Index. Add Primary Key to Filter.
    if(
      !Lib.Utils.isNullOrUndefined(secondary_index) && // Is Secondary Index
      !Lib.Utils.isNullOrUndefined(id_key) &&
      !Lib.Utils.isNullOrUndefined(id_value)
    ){
      service_params.filter[id_key] = id_value;
    }


    // Build Query Filter based on if it's Primary-Index or Secondary-Index
    // Is Primary-Index and Condition is send
    if(
      Lib.Utils.isNullOrUndefined(secondary_index) && // It's a Primary-Index
      !Lib.Utils.isEmpty(condition) && // Check if 'condition' exists
      !Lib.Utils.isNullOrUndefined(condition.value) // Check if 'sort-key' value exists
    ){

      // Copy Condition Value
      let condition_value = condition.value;
      let condition_value2 = condition.value2;

      // Converts the index into a formatted index string
      // Check if object-type index conversion is enabled
      if(
        CONFIG.INDEX_ENABLE_OBJECT &&
        !Lib.Utils.isNullOrUndefined(id_value) // Must have Primary-Key Value
      ){
        // Modify value to follow the format: 'partition_value#sort_value'
        condition_value = id_value + CONFIG.INDEX_SEPARATOR_CHAR + condition_value;
        condition_value2 = id_value + CONFIG.INDEX_SEPARATOR_CHAR + condition_value2;
      }

      // Different operators have different type of syntax
      if( condition.operator === 'begins_with' ){ // Condition for 'begins_with'
        service_params.filter[id_key] = { '$regex': '^' + _NoDB.escapeRegExpForMongoDB(condition_value) };
      }
      else if( condition.operator === 'between' ){ // Condition for 'between'
        service_params.filter[id_key] = { '$gte': condition_value, '$lte': condition_value2 };
      }
      else if( condition.operator === '<' || condition.operator === 'lt' ){ // Condition for less-then
        service_params.filter[id_key] = { '$lt': condition_value };
      }
      else if( condition.operator === '<=' || condition.operator === 'lte' ){ // Condition for less-then-equal
        service_params.filter[id_key] = { '$lte': condition_value };
      }
      else if( condition.operator === '>' || condition.operator === 'gt' ){ // Condition for greater-then
        service_params.filter[id_key] = { '$gt': condition_value };
      }
      else if( condition.operator === '>=' || condition.operator === 'gte' ){ // Condition for greater-then-equal
        service_params.filter[id_key] = { '$gte': condition_value };
      }
      else { // Default as '='
        service_params.filter[id_key] = condition_value;
      }

    }

    // Is Primary-Index and Condition is not send
    else if(
      Lib.Utils.isNullOrUndefined(secondary_index) && // It's a Primary-Index
      Lib.Utils.isEmpty(condition) // Check if 'condition' does not exists
    ){

      // Construct Condition Value
      let condition_value = id_value + CONFIG.INDEX_SEPARATOR_CHAR;

      // Build Query
      service_params.filter[id_key] = { '$regex': '^' + _NoDB.escapeRegExpForMongoDB(condition_value) }; // Begins with Partition-key
    }


    // For Secondary-Index
    else if(
      !Lib.Utils.isNullOrUndefined(secondary_index) && // It's a Secondary-Index
      !Lib.Utils.isEmpty(condition) // Check if 'condition' exists
    ){

      // Since secondary-index has seperate sort key, use it for order-by
      order_by_key = condition.key;

      // Different operators have different type of syntax
      if( condition.operator === 'begins_with' ){ // Condition for 'begins_with'
        service_params.filter[condition.key] = { '$regex': '^' + _NoDB.escapeRegExpForMongoDB(condition.value) };
      }
      else if( condition.operator === 'between' ){ // Condition for 'between'
        service_params.filter[condition.key] = { '$gte': condition.value, '$lte': condition.value2 };
      }
      else if( condition.operator === '<' || condition.operator === 'lt' ){ // Condition for less-then
        service_params.filter[condition.key] = { '$lt': condition.value };
      }
      else if( condition.operator === '<=' || condition.operator === 'lte' ){ // Condition for less-then-equal
        service_params.filter[condition.key] = { '$lte': condition.value };
      }
      else if( condition.operator === '>' || condition.operator === 'gt' ){ // Condition for greater-then
        service_params.filter[condition.key] = { '$gt': condition.value };
      }
      else if( condition.operator === '>=' || condition.operator === 'gte' ){ // Condition for greater-then-equal
        service_params.filter[condition.key] = { '$gte': condition.value };
      }
      else { // Default as '='
        service_params.filter[condition.key] = condition.value;
      }

    }


    // If only particular feilds value is to be fetched
    if( !Lib.Utils.isNullOrUndefined(fields_list) ){ // Only if not null

      // Convert each key to object {'key_abc':1}
      service_params.options['projection'] = {};
      fields_list.forEach(function(key){
        service_params.options['projection'][key] = 1;
      });

    }


    // Handle Paging - Optional Start
    if(
      !Lib.Utils.isNullOrUndefined(paging) &&
      !Lib.Utils.isNullOrUndefined(paging['start'])
    ){
      service_params.options['skip'] = paging['start'];
    }

    // Handle Paging - Optional Limit
    if(
      !Lib.Utils.isNullOrUndefined(paging) &&
      !Lib.Utils.isNullOrUndefined(paging['limit'])
    ){ // Optional Limit on number of records
      service_params.options['limit'] = paging['limit'];
    }
    else {
      service_params.options['limit'] = 100;
    }


    // If Results are to be sorted in Ascending Order
    if( !Lib.Utils.isNullOrUndefined(condition) && condition['asc'] ){
      service_params.options['sort'] = { [order_by_key]: 1 }; // Ascending
    }
    else {
      service_params.options['sort'] = { [order_by_key]: -1 }; // Descending (default)
    }


    // Return Service-Params
    return service_params;

  },


  /********************************************************************
  No-sql get Multiple records for known partition key

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} collection_name - Table in which new entry is to be created
  @param {String} [secondary_index] - Not applicable for MongoDB. Directly works on ID-Key
  @param {String} [id_key] - ID key name of secondary-index. null for '_id' as default
  @param {String} id_value - ID Value
  @param {String} [fields_list] - (Optional) Retrieve only particular feilds value. send null to get all feilds
  @param {String} [paging] - (Optional) Start and Limit for pagination
  * @param {Number} [paging.start] - (Optional) Number of records to skip (Send undefined in case no starting pointer)
  * @param {Number} [paging.limit] - Number of records to be fetched (Default Limit 100)
  @param {String} [condition] - (Optional) Additional condition on sort key
  * @param {String} [condition.operator] - (Optional) Special comparison operator '=' | '<=' | '<' | '>=' | '>' | 'begins_with' | 'between'
  * @param {String} condition.key - sort key on which comparison is to be done
  * @param {Integer|String} condition.value - sort key value for comparison
  * @param {Integer|String} condition.value2 - sort key second value for comparison (Only in case of 'between' operator) (including this value if exact-match, else excluding this value if string starts-with)
  * @param {Boolean} condition.asc - (Optional) True means get results in Ascending order. Default in Decending order
  @param {String} [select] - Not applicable in mongodb
  @param {Set} [result_chain] - (Optional) To overcome AWS limits, recursive call to this function with carry over results

  @return Thru request Callback.

  @callback - Request Callback(err, response, count, last_evaluated_key)
  * @callback {Error} err - In case of error
  * @callback {Boolean} response - array of records on success
  * @callback {Boolean} response - false if record not found or error
  * @callback {Integer} count - Number of records found
  * @callback {Integer} next - Start number for next page
  *********************************************************************/
  queryRecords: function(
    instance, cb,
    collection_name, secondary_index, id_key, id_value,
    fields_list, paging, condition, select,
    result_chain
  ){

    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);


    // Service Params
    var service_params = NoDB.commandBuilderForQueryRecords(
      collection_name, secondary_index, id_key, id_value,
      fields_list, paging, condition
    );

    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);


    // Get the Records
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Query Records', instance['time_ms']);
    collection.find(service_params.filter, service_params.options).toArray()

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Query Records', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        // Determine Next
        let next = null;
        if( response.length == service_params.options['limit'] ){
          next = service_params.options['limit'] + Lib.Utils.fallback(service_params.options['skip'], 0);
        }

        // Return Records
        if( !Lib.Utils.isEmpty(response) ){

          // Appends index keys (partition-key and sort-key) to the data in responses
          response = response.map(function(data){
            return _NoDB.appendIndexObjectKeysFromData(data);
          });

          // Return Records
          cb(null, response, response.length, next);
        }
        else {
          cb(null, false, 0, null); // Record not found. Return false.
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Query Records' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  No-sql get count of records using Query
  (Only Costs 0.5 read unit for Counting 100 Records or 1MB of Data)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} collection_name - Table in which new entry is to be created
  @param {String} [secondary_index] - Not applicable for MongoDB. Directly works on ID-Key
  @param {String} [id_key] - ID key name of secondary-index. null for '_id' as default
  @param {String} id_value - ID Value
  @param {String} [condition] - (Optional) Additional condition on sort key
  * @param {String} [condition.operator] - (Optional) Special comparison operator '=' | '<=' | '<' | '>=' | '>' | 'begins_with' | 'between'
  * @param {String} condition.key - sort key on which comparison is to be done
  * @param {Integer|String} condition.value - sort key value for comparison
  * @param {Integer|String} condition.value2 - sort key second value for comparison (Only in case of 'between' operator) (including this value if exact-match, else excluding this value if string starts-with)

  @return Thru request Callback.

  @callback - Request Callback(err, count)
  * @callback {Error} err - In case of error
  * @callback {Integer} count - Number of records found
  *********************************************************************/
  count: function(
    instance, cb,
    collection_name, secondary_index, id_key, id_value,
    condition
  ){

    // Initialize MongoDB service if not already Initialized
    _NoDB.initIfNot(instance);


    // Service Params
    var service_params = NoDB.commandBuilderForQueryRecords(
      collection_name, secondary_index, id_key, id_value,
      null, null, condition
    );

    // Collection
    const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);


    // Get the Records
    Lib.Debug.timingAuditLog('Start', 'MongoDB - Count Records', instance['time_ms']);
    collection.countDocuments(service_params.filter)

      .then(function(response){
        Lib.Debug.timingAuditLog('End', 'MongoDB - Count Records', instance['time_ms']);

        //Lib.Debug.log("MongoDB response: " +  JSON.stringify(response) );

        if(response){
          cb(null, response); // Records Found
        }
        else {
          cb(null, false); // No record found
        }

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: MongoDB' +
          '\ncmd: Count Records' +
          '\nparams: ' + JSON.stringify(index_filter)
        );

        // Invoke Callback and forward error from mongodb
        return cb(err);

      });

  },


  /********************************************************************
  TODO: Batch write operation that groups up to any number requests (Non-Atomically)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Set[]} [add_records] - (Optional) Command-Objs for records to be added
  @param {Set[]} [update_records] - (Optional) Command-Objs of records to be updated
  @param {Set[]} [delete_records] - (Optional) Command-Objs of records to be deleted

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful transaction
  * @callback {Boolean} is_success - false on unsuccessful transaction or error
  *********************************************************************/
  batchWrite: function(
    instance, cb,
    add_records, update_records, delete_records
  ){

    // TODO

  },


  /********************************************************************
  Synchronous write operation that groups multiple requests (Atomically)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {Set[]} [check_records] - (Optional) Command-Objs for records to be checked (TODO)
  @param {Set[]} [add_records] - (Optional) Command-Objs for records to be added
  @param {Set[]} [update_records] - (Optional) Command-Objs of records to be updated
  @param {Set[]} [delete_records] - (Optional) Command-Objs of records to be deleted

  @return Thru request Callback.

  @callback - Request Callback(err, is_success)
  * @callback {Error} err - In case of error
  * @callback {Boolean} is_success - true on successful transaction
  * @callback {Boolean} is_success - false on unsuccessful transaction or error
  *********************************************************************/
  transactWrite: async function(
    instance, cb,
    check_records, add_records, update_records, delete_records
  ){

    // Initialize AWS service Object if not already Initialized
    _NoDB.initIfNot(instance);


    // Transaction Options
    const transaction_options = {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary'
    };

    // Start the Session
    const session = instance.nodb.mongodb.startSession();


    // Start Transaction
    try {

      // Start the transaction in the session, specifying the transaction options
      Lib.Debug.timingAuditLog('Start', 'MongoDB - Transact Write', instance['time_ms']);
      session.startTransaction(transaction_options);

      // Add Records
      if( !Lib.Utils.isEmpty(add_records) ){

        // Iterate each add-record command
        for(const service_params of add_records){

          // Collection
          const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);

          // Add/Replace Record
          await collection.replaceOne(service_params.filter, service_params.data, service_params.options);

        }

      } // End Add Records


      // Update Records
      if( !Lib.Utils.isEmpty(update_records) ){

        // Iterate each add-record command
        for(const service_params of update_records){

          // Collection
          const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);

          // Update Record
          await collection.findOneAndUpdate(service_params.filter, service_params.updates, service_params.options);

        }

      } // End Update Records


      // Delete Records
      if( !Lib.Utils.isEmpty(delete_records) ){

        // Iterate each add-record command
        for(const service_params of delete_records){

          // Collection
          const collection = instance.nodb.mongodb.db(CONFIG.DATABASE).collection(service_params.collection_name);

          // Delete Record
          await collection.deleteOne(service_params.filter);

        }

      } // End Delete Records

      // Commit the transaction to apply all commands performed within it
      await session.commitTransaction();

      // Transaction Successful - Return Success
      Lib.Debug.timingAuditLog('End', 'MongoDB - Transact Write', instance['time_ms']);
      cb(null, true);

    }

    // Handle failed transaction
    catch(err){

      // Log error for research
      Lib.Debug.logErrorForResearch(
        err,
        'Cause: MongoDB' +
        '\ncmd: Transaction Write' +
        '\nparams: ' //+ JSON.stringify()
      );

      // Abort the Transaction
      await session.abortTransaction();

      // Invoke Callback and forward error from mongodb
      return cb(err);

    }

  },

};///////////////////////////Public Functions END//////////////////////////////



//////////////////////////Private Functions START//////////////////////////////
const _NoDB = { // Private functions accessible within this modules only

  /********************************************************************
  Initialize MongoDB Service Connection - Only if not already initialized

  @param {reference} instance - Request Instance object reference

  @return - None
  *********************************************************************/
  initIfNot: function(instance){

    // Create 'nodb' object in instance if it's not already present
    if (!('nodb' in instance)) {
      instance['nodb'] = {};
    }

    // Initialize only if 'mongodb' object is not already Initialized
    if (!Lib.Utils.isNullOrUndefined(instance.nodb.mongodb)) {
      return; // Do not proceed since already initalized
    }


    // Reach here means MongoDB service is not initialized and initialize it now
    Lib.Debug.timingAuditLog('Init-Start', 'MongoDB Connection (nodb)', instance['time_ms']);

    // Create a new MongoClient
    const mongo_client = new MongoClient(
      _NoDB.constructConnectionUri() // MongoDB connection URI
    );

    // Assign the connected client to the instance
    instance.nodb.mongodb = mongo_client;

    // Close MongoDB connection at the time of cleanup
    Lib.Instance.addCleanupRoutine( instance, _NoDB.close );

    Lib.Debug.timingAuditLog('Init-End', 'MongoDB Connection (nodb)', instance['time_ms']);

  },


  /********************************************************************
  Close connection with MongoDB Database
  (Must be invoked if connection has been Initialized)

  @param {reference} instance - Request Instance object reference

  @return {void} - Nothing. Internally closes connection with MongoDB Host
  *********************************************************************/
  close: function(instance){

    // Check if the MongoDB client exists and is connected
    if( instance.nodb && instance.nodb.mongodb ){

      // Close the connection
      instance.nodb.mongodb.close(function(err){

        // Do not forward connection closing error. Log it for internal research.
        if(err){
          // Log error for research
          Lib.Debug.logErrorForResearch(
            err,
            'Cause: MongoDB' +
            '\ncmd: Close MongoDB connection'
          );
        }

        //
        instance.nodb.mongodb = null; // Reset to null to free memory

      });

    }

  },


  /********************************************************************
  Construct MongoDB Connection URI String

  No params

  @returns {string} The constructed MongoDB connection URI.
  *********************************************************************/
  constructConnectionUri: function(){

  // Encoding username and password to ensure special characters are handled correctly
  const encoded_username = encodeURIComponent(CONFIG.USER);
  const encoded_password = encodeURIComponent(CONFIG.PASS);

  // Constructing the MongoDB connection URI return
  return `${CONFIG.PROTOCOL}://${encoded_username}:${encoded_password}@${CONFIG.HOST}/${CONFIG.DATABASE}?retryWrites=true&w=majority`;

  },


  /********************************************************************
  Creates a new object with all values from the original object converted to their negative equivalents
  Used for Decremented values
  {'age':10} => {'age':-10}

  @param {Set} obj - Object to be processed.

  @returns {Set} A new object with all values converted to negative.
  *********************************************************************/
  convertToNegative: function(obj){

    // Initialize a new object
    var negative_obj = {};

    // Iterate over each property in the original object
    Object.keys(obj).forEach(function(key) {
      negative_obj[key] = -Math.abs( obj[key] ); // Convert the value to negative and store in the new object
    });

    // Return the new object
    return negative_obj;

  },


  /********************************************************************
  Transforms a given data input into a formatted index value string.

  This function handles two types of inputs:
  1. If 'data' is an object containing keys specified in the configuration (INDEX_PARTITION_KEY and INDEX_SORT_KEY),
     it concatenates their values using the INDEX_SEPARATOR_CHAR.
  2. If 'data' is a string or does not contain the required keys, it returns the original string value or the '_id' attribute.

  @param {String|Set} data - The data to be transformed. Can be a string or an object.
  * @param {String|Number} partition_value - Partition Value
  * @param {String|Number} sort_value - Sort Value

  @returns {String} The formatted index value string or null if input is invalid
  *********************************************************************/
  formatIndexStringFromData: function(data){

    // Check for null or undefined input
    if( Lib.Utils.isNullOrUndefined(data) ){
      return null;
    }


    // Check if object conversion is enabled and partition key is present
    if(
      CONFIG.INDEX_ENABLE_OBJECT && // Index object conversion is enabled
      !Lib.Utils.isNullOrUndefined( data[CONFIG.INDEX_PARTITION_KEY] ) // Partition key is available in data
    ){

      // Initialize string with the partition key value
      let str = data[CONFIG.INDEX_PARTITION_KEY];

      // Check if sort key is available and append it to the string
      if( !Lib.Utils.isNullOrUndefined(data[CONFIG.INDEX_SORT_KEY]) ){
        // Concatenate values using the join character from configuration
        str += CONFIG.INDEX_SEPARATOR_CHAR + data[CONFIG.INDEX_SORT_KEY]; // Construct partition_key#sort_key
      }

      // Return the constructed string or only the partition key if sort key is not present
      return str;

    }

    // Return the original string value or the '_id' attribute for non-object or missing key scenarios
    else {
      return Lib.Utils.isString(data) ? data : data._id;
    }

  },


  /********************************************************************
  Removes index-related keys (partition-key and sort-key) from the provided data object.

  It creates a deep copy of the original data and removes the index keys if they exist.
  Only operates if object conversion is enabled.

  @param {Set} data - Data from which Index keys are to be removed
  * @param {Any} partition_value - Partition Value
  * @param {Any} sort_value - Sort Value
  * ...

  @returns {Set} data - Deep copy of data with removed keys
  *********************************************************************/
  removeIndexObjectKeysFromData: function(data){

    // Return the input directly if it is null or undefined
    if( Lib.Utils.isNullOrUndefined(data)  ){
      return data; // Return as-it-is
    }


    // Skip if index keys object conversion is disabled
    if(
      !CONFIG.INDEX_ENABLE_OBJECT ||
      !CONFIG.SKIP_SAVING_INDEX_KEYS
    ){
      return data; // Return as-it-is
    }


    // Remove index keys if object conversion is enabled and keys are present

    // Create a deep copy of the input data
    var data_new = Lib.Utils.deepCopyObject(data);

    // Delete the partition-key from the new data object if it exists
    if( !Lib.Utils.isNullOrUndefined(data[CONFIG.INDEX_PARTITION_KEY]) ){
      delete data_new[CONFIG.INDEX_PARTITION_KEY]; // Delete partition key
    }

    // Delete the sort-key from the new data object if it exists
    if( !Lib.Utils.isNullOrUndefined(data[CONFIG.INDEX_SORT_KEY]) ){
      delete data_new[CONFIG.INDEX_SORT_KEY]; // Delete sort key
    }

    // Return the modified data object
    return data_new;

  },


  /********************************************************************
  Appends partition-key and sort-key to the provided data object based on its '_id' value.

  This function is useful for reconstructing index-related keys from the '_id' field in data.
  It splits the '_id' value into partition-key and sort-key and appends them to the data object.
  Only operates if object conversion is enabled.

  @param {Set} data - Data in which index keys are to be added
  * ...

  @returns {Set} data - Deep copy of data with removed keys
  * @param {Any} partition_value - Partition Value
  * @param {Any} sort_value - Sort Value
  * ...
  *********************************************************************/
  appendIndexObjectKeysFromData: function(data){

    // Return the input directly if it is null, undefined, or lacks an '_id' field
    if(
      Lib.Utils.isNullOrUndefined( data ) ||
      Lib.Utils.isNullOrUndefined( data['_id'] )
    ){
      return data; // Return as-it-is
    }


    // Skip if index keys object conversion is disabled
    if(
      !CONFIG.INDEX_ENABLE_OBJECT ||
      !CONFIG.SKIP_SAVING_INDEX_KEYS
    ){
      return data; // Return as-it-is
    }


    // Append index keys if object conversion is enabled

    // Split the '_id' value into partition and sort keys
    const [partition_key, sort_key] = data['_id'].split(CONFIG.INDEX_SEPARATOR_CHAR);

    // Append the partition-key to data if it exists
    if( !Lib.Utils.isNullOrUndefined(partition_key) ){
      data[CONFIG.INDEX_PARTITION_KEY] = partition_key; // Append partition key
    }

    // Append the sort-key to data if it exists
    if( !Lib.Utils.isNullOrUndefined(sort_key) ){
      data[CONFIG.INDEX_SORT_KEY] = sort_key; // Append sort key
    }

    // Return the modified data object
    return data;

  },


  /********************************************************************
  Escapes special characters in a string for use in MongoDB regular expressions.
  It ensures that special characters in the string are treated as literals in the regex pattern.

  @param {String} string - The string to be escaped for MongoDB regex use.

  @returns {String} - The escaped string, safe for use in MongoDB regex patterns.
  *********************************************************************/
  escapeRegExpForMongoDB: function(str){

    // Check if the input string is null or undefined, and return it unchanged if so
    if( Lib.Utils.isNullOrUndefined(str) ){
      return str; // Return as-it-is
    }

    // Escaping special characters by replacing them with their escaped versions
    // This makes the string safe for use in MongoDB regex patterns
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  },

};//////////////////////////Private Functions END//////////////////////////////
