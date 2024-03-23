// Info: Test Cases
'use strict';

// Shared Dependencies
var Lib = {};

// Set Configrations
const nodb_config = {
  'PROTOCOL'  : require('./.mongo_cloud.json')['PROTOCOL'],
  'HOST'      : require('./.mongo_cloud.json')['HOST'],
  'USER'      : require('./.mongo_cloud.json')['USER'],
  'PASS'      : require('./.mongo_cloud.json')['PASS'],
  'DATABASE'  : require('./.mongo_cloud.json')['DATABASE'],

  'INDEX_ENABLE_OBJECT': true,
  'INDEX_PARTITION_KEY': 'part_id', // Partition Key
  'INDEX_SORT_KEY': 'sort_id', // Sort Key
  'INDEX_SEPARATOR_CHAR': '|^|', // Join '|^|'

};

// Dependencies
Lib.Utils = require('js-helper-utils');
Lib.Debug = require('js-helper-debug')(Lib);
Lib.Instance = require('js-helper-instance')(Lib);
const NoDB = require('js-helper-mongodb')(Lib, nodb_config);


////////////////////////////SIMILUTATIONS//////////////////////////////////////

function test_output_simple(err, response){ // Result are from previous function

  if(err){
    Lib.Debug.logErrorForResearch(err);
  }

  Lib.Debug.log('response', response);

  // cleanup instance - close open connections
  Lib.Instance.cleanup(instance);

};


function test_output_query(err, response, count, last_evaluated_key){ // Result are from previous function

  if(err){
    Lib.Debug.logErrorForResearch(err);
  }

  Lib.Debug.log('response', response);
  Lib.Debug.log('count', count);
  Lib.Debug.log('last_evaluated_key', last_evaluated_key);

  // cleanup instance - close open connections
  Lib.Instance.cleanup(instance);

};

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////STAGE SETUP///////////////////////////////////////

// Initialize 'instance'
var instance = Lib.Instance.initialize();

// Set test url
var table = 'test_table';
var table_2 = 'test_table2';
var table_live = 'ctp_coupon_code';

// Dummy record
var dummy_record = {
  //'_id': 'fruits|^|apple',
  'part_id': 'fruits',
  'sort_id': 'apple',
  'color': 'red',
  'types': 30
};

var dummy_record2 = {
  '_id': 'fruits|^|pear_small',
  'part_id': 'fruits',
  'sort_id': 'pear_small',
  'color': 'green',
  'types': 2
};

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////////TESTS/////////////////////////////////////////


/*
// Test commandBuilderForAddRecord()
var add_command = NoDB.commandBuilderForAddRecord(
  table,
  dummy_record2
);

console.log(
  'commandBuilderForAddRecord()',
  add_command
);


// Test commandAddRecord()
NoDB.commandAddRecord(
  instance,
  test_output_simple,
  add_command
);
*/



/*
// Test addRecord()
NoDB.addRecord(
  instance,
  test_output_simple,
  table,
  dummy_record
);
*/




/*
// Test addBatchRecords()
var dummy_records_in_table_1 = [];
for(let i = 1; i<=200; i++){ // Generate Dummy Records
  dummy_record = {
    //'_id': 'fruits|^|bulk_' + i,
    'part_id': 'fruits',
    'sort_id': 'bulk_' + i,
    'color': 'red',
    'types': i
  };
  dummy_records_in_table_1.push(dummy_record);
}

var dummy_records_in_table_2 = [];
for(let i = 1; i<=50; i++){ // Generate Dummy Records
  dummy_record = {
    //'_id': 'deserts|^|bulk_' + i,
    'part_id': 'deserts',
    'sort_id': 'bulk_' + i,
    'color': 'green',
    'types': i
  };
  dummy_records_in_table_2.push(dummy_record);
}
NoDB.addBatchRecords(
  instance,
  test_output_simple,
  [table, table_2],
  [dummy_records_in_table_1, dummy_records_in_table_2]
);
*/



/*
// Test commandBuilderForDeleteRecord()
var delete_command = NoDB.commandBuilderForDeleteRecord(
  table,
  'fruits|^|bulk_1' // Record to be deleted
  // { // Record to be deleted (Set{} format)
  //   'part_id': 'fruits',
  //   'sort_id': 'bulk_1'
  // }
);

console.log(
  'commandBuilderForDeleteRecord()',
  delete_command
);


// Test commandDeleteRecord()
NoDB.commandDeleteRecord(
  instance,
  test_output_simple,
  delete_command
);
*/



/*
// Test deleteRecord()
NoDB.deleteRecord(
  instance,
  test_output_simple,
  table,
  //'fruits|^|bulk_2', // Record to be deleted
  { // Record to be deleted (Set{} format)
    'part_id': 'fruits',
    'sort_id': 'bulk_2'
  }
);
*/



/*
// Test deleteBatchRecords()
var dummy_records_for_table_1 = [];
for(let i = 11; i<= 50; i++){ // Generate Dummy Records
  //dummy_record = 'fruits|^|bulk_' + i; // Record to be deleted
  dummy_record = { // Record to be deleted (Set{} format)
    'part_id': 'fruits',
    'sort_id': 'bulk_' + i,
  };
  dummy_records_for_table_1.push(dummy_record);
}

var dummy_records_for_table_2 = [];
for(let i = 1; i<= 10; i++){ // Generate Dummy Records
  //dummy_record = 'deserts|^|bulk_' + i; // Record to be deleted
  dummy_record = { // Record to be deleted (Set{} format)
   'part_id': 'deserts',
   'sort_id': 'bulk_' + i,
  };
  dummy_records_for_table_2.push(dummy_record);
}
NoDB.deleteBatchRecords(
  instance,
  test_output_simple,
  [table, table_2],
  [dummy_records_for_table_1, dummy_records_for_table_2]
);
*/



/*
// Test commandBuilderForUpdateRecord()
var update_command = NoDB.commandBuilderForUpdateRecord(
  table,
  //'fruits|^|apple', // Key
  { // Key (Set{} Format)
    'part_id': 'fruits',
    'sort_id': 'apple'
  },
  null, // No Update Data
  null, // No Remove Keys
  { // Increments
    'price': 10, // Increment price by 10
    'discount': 15, // Increment discount by 15
  },
  { // Decrements
    'key1': 35, // Decrement key1 by 35
  },
  'ALL_NEW', //'ALL_NEW', | 'ALL_OLD'
);

console.log(
  'commandBuilderForUpdateRecord()',
  update_command
);


// Test commandUpdateRecord()
NoDB.commandUpdateRecord(
  instance,
  test_output_simple,
  update_command
);
*/



/*
// Test update() - Update-Data & Remove-Keys
NoDB.updateRecord(
  instance,
  test_output_simple,
  table,
  //'fruits|^|apple', // Key
  { // Key (Set{} Format)
    'part_id': 'fruits',
    'sort_id': 'appleeeee'
  },
  { // Updated Data
    'part_id': 'fruits',
    'sort_id': 'apple',
    'price': 40,
    'discount': 20,
    'key1': 90
  },
  [ // Remove Keys
    'types'
  ],
  null, // No Increments
  null, // No Decrements
  'ALL_NEW', //'ALL_NEW', | 'ALL_OLD'
  ///true // Do not upsert
);
*/



/*
// Test update() - Increment & Decrement
NoDB.updateRecord(
  instance,
  test_output_simple,
  table,
  //'fruits|^|apple', // Key
  { // Key (Set{} Format)
    'part_id': 'fruits',
    'sort_id': 'apple'
  },
  null, // No Update Data
  null, // No Remove Keys
  { // Increments
    'price': 10, // Increment price by 10
    'discount': 15, // Increment discount by 15
  },
  { // Decrements
    'key1': 25, // Decrement key1 by 35
  },
  'ALL_NEW' //'ALL_NEW', | 'ALL_OLD'
);
*/



/*
// Test getRecord()
NoDB.getRecord( // With no conditions
  instance,
  test_output_simple,
  table,
  //'fruits|^|apple'
  { // Record to be Get (Set{} format)
    'part_id': 'fruits',
    'sort_id': 'apple'
  }
);
*/



/*
// Test getBatchRecords()
NoDB.getBatchRecords( // With no conditions
  instance,
  test_output_simple,
  [table, table_2, 'non_existant_table'],
  // [ // Keys
  //   ['fruits|^|apple'], // Table-1 Keys
  //   ['deserts|^|bulk_11', 'deserts|^|bulk_12', 'bad_key'], // Table-2 Keys
  //   ['bad_key'], // non_existant_table Keys
  // ]
  [ // (Set{} Format)
    [{'part_id': 'fruits', 'sort_id': 'apple'}], // Table-1 Keys
    [{'part_id': 'deserts', 'sort_id': 'bulk_11'}, {'part_id': 'deserts', 'sort_id': 'bulk_12'}], // Table-2 Keys
    [{'part_id': 'bad', 'sort_id': 'bad'}], // non_existant_table Keys
  ]
);
*/



/*
// Test getBatchRecords()
NoDB.getBatchRecords( // With no conditions
  instance,
  test_output_simple,
  [table, table_2, 'non_existant_table'],
  // [ // Keys
  //   ['fruits|^|apple'], // Table-1 Keys
  //   ['deserts|^|bulk_11', 'deserts|^|bulk_12', 'bad_key'], // Table-2 Keys
  //   ['bad_key'], // non_existant_table Keys
  // ]
  [ // (Set{} Format)
    [{'types': 6}, {'types': 7}, {'types': 9}], // Table-1 Keys
    [{'types': 12}, {'types': 48}, {'types': 'non_existant'}], // Table-2 Keys
    [{'sort_id': 'bad'}], // non_existant_table Keys
  ],
  true // Secondary Index
);
*/



/*
// Test queryRecords() - With no conditions
NoDB.queryRecords(
  instance,
  test_output_query,
  table,
  null, // secondary_index
  null, // Partition-Key
  null, // Partition-Key value
  null, // feilds_list
  null, // paging
  null, // condition
);
*/



/*
// Test queryRecords() - With no conditions
NoDB.queryRecords(
  instance,
  test_output_query,
  table,
  null, // secondary_index
  'part_id', // Partition-Key
  'fruits', // Partition-Key value
  null, // feilds_list
  null, // paging
  null, // condition
);
*/



/*
// Test queryRecords() - With Conditions on Sort-key (begins-with)
NoDB.queryRecords(
  instance,
  test_output_query,
  table,
  null, // secondary_index
  'part_id', // Partition-Key
  //null, // Partition-Key value not required for non Set{} Format
  'fruits', // Partition-Key value for Set{} Format
  null, // feilds_list
  { // paging
    'start': 20,
    'limit': 10
  },
  { // condition
    //'value': 'fruits|^|bulk_1', // (Non Set{} Format)
    'value': 'bulk_1', // (Set{} Format)
    'operator': 'begins_with',
    'asc': true
  }
);
*/



/*
// Test queryRecords() - With Conditions on Sort-key (between)
NoDB.queryRecords(
  instance,
  test_output_query,
  table,
  null, // secondary_index
  'part_id', // Partition-Key
  //null, // Partition-Key value not required for non Set{} Format
  'fruits', // Partition-Key value for Set{} Format
  ['color', 'types'], // feilds_list
  null, // paging
  { // condition
    //'value': 'fruits|^|bulk_101',
    //'value2': 'fruits|^|bulk_109',
    'value': 'bulk_101', // (Set{} Format)
    'value2': 'bulk_109', // (Set{} Format)
    'operator': 'between',
    'asc': true
  }
);
*/



/*
// Test queryRecords() - For Secondary Index
NoDB.queryRecords(
  instance,
  test_output_query,
  table,
  'sec_index', // secondary_index
  'part_id', // Partition-Key
  'fruits', // Partition-Key value
  null, // feilds_list
  { // paging
    'start': 2,
    'limit': 10
  },
  { // condition
    'key': 'types',
    'value': 10,
    'operator': '<',
    'asc': false
  }
);
*/



/*
// Test count()
NoDB.count(
  instance,
  test_output_simple,
  table,
  null, // secondary_index
  null, // Secondary Index id key
  //null, // id value is null for non-set index
  'fruits', // id value (Set{} Format)
  { // condition
    //'value': 'fruits|^|bulk_101',
    //'value2': 'fruits|^|bulk_109',
    'value': 'bulk_101', // (Set{} Format)
    'value2': 'bulk_109', // (Set{} Format)
    'operator': 'between',
  }
);
*/



/*
// Test transactWrite()
var add_command = NoDB.commandBuilderForAddRecord(
  table,
  dummy_record2
);
var delete_command = NoDB.commandBuilderForDeleteRecord(
  table,
  'fruits|^|bulk_5' // Record to be deleted
  // { // Record to be deleted (Set{} Format)
  //   'part_id': 'fruits',
  //   'sort_id': 'bulk_5'
  // }
);
var update_command = NoDB.commandBuilderForUpdateRecord(
  table,
  'fruits|^|apple', // Key
  // { // Key (Set{} Format)
  //   'part_id': 'fruits',
  //   'sort_id': 'apple'
  // },
  null, // No Update Data
  null, // No Remove Keys
  { // Increments
    'price': 10, // Increment price by 10
    'discount': 15, // Increment discount by 15
  },
  { // Decrements
    'key2': 35, // Decrement key1 by 35
  }
);
NoDB.transactWrite(
  instance,
  test_output_simple,
  null, // No Check-Records
  [ // List of 'Add-Records'
    add_command
  ],
  [ // List of 'Update-Records'
    update_command
  ],
  [ // List of 'Delete-Records'
    delete_command
  ]
);
*/

///////////////////////////////////////////////////////////////////////////////
