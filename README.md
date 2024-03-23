# NoSQL Library (For MongoDB)#

This library provides interface to MongoDB Services. Use configuration params to set Database connection attributes.


**************************************************


Test
----
* Create test IAM profile, IAM User, S3 bucket on AWS
* Change AWS `key` and `secret` in test file
* Install 'Test' project dependencies `$ npm install`
* Run 'test' script `$ node test.js`


**************************************************


Usage
-----
### Reference this library in your Project's package.json
```
"dependencies": {
  "js-helper-mongodb": "git+https://github.com/<git_org_name>/js-helper-mongodb.git"
}
```
### Reference this library in your Project's npm
```
"dependencies": {
  "js-helper-mongodb": "npm:@<git_org_name>/js-helper-mongodb@^1.0.0"
}
```


### Include this library in your Project
```javascript
const NoDB = require('js-helper-mongodb');
```


### Set or Override default configuration as per you development or production environment needs
```javascript
NoDB.config({
  // Database Details
  PROTOCOL: 'mongodb+srv', // Connection Protocol. mongodb+srv or mongodb
  HOST: 'your-host', // Host address of the MongoDB server, including the port. Ex: cluster0.example.mongodb.net
  USER: 'your-username', // Username for the MongoDB database
  PASS: 'your-password', // Password for the MongoDB database
  DATABASE: 'your-database-name', // Name of the MongoDB database
});
```


**************************************************
