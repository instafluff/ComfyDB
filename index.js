const mongo = require( "./mongo" )();

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);

  insertDocuments(db, function() {
    client.close();
  });
});

const insertDocuments = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('documents');
  // Insert some documents
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
}

const COMPARE = {
  Equal: "=",
  NotEqual: "!",
  LessThan: "<",
  LessThanOrEqual: "<=",
  GreaterThan: ">",
  GreaterThanOrEqual: ">=",
  StartsWith: "^",
  EndsWith: "$",
  Contains: "_",
  True: "1",
  False: "0"
};

let comfyDB = {
  Collection: {
    Create: function( name ) {},
    List: function() {},
    Delete: function( name ) {},
  },
  Is: COMPARE,
  Data: {
    Set: function( collection, id, data, overwrite = true ) {
      // check if key is a single string or an array for batch update
      // TODO: Add Objects, tagging with ID and timestamp for create/update
    },
    Delete: function( collection, id ) {
      // check if key is a single string or an array for batch update
      // TODO: Delete objects
    },
    Increment: function( collection, id, key, amount ) {},
    Decrement: function( collection, id, key, amount ) {
      comfyDB.Increment( collection, id, key, -amount );
    },
    Find: function( collection, options ) {

    },
    FindById: function( collection, id ) {
      comfyDB.Find( { id });
    },
    FindByKey: function( collection, key, compare = COMPARE.True, value = "", count = 100, descending = true ) {
      comfyDB.Find( {
        key,
        compare,
        value,
        count,
        isOrderDescending: descending
      });
    },
    FindLatest: function( collection, count = 100 ) {
      comfyDB.Find( {
        key: "updated",
        count,
        isOrderDescending: true
      } );
    },
    Count: function( collection, key, compare = COMPARE.True, value = "" ) {},
  },
};

module.exports = comfyDB;
