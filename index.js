const mongo = require( "./mongo" )();

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// // Connection URL
// const url = 'mongodb://localhost:27017';

// // Database Name
// const dbName = 'myproject';

// // Create a new MongoClient
// const client = new MongoClient(url);

// // Use connect method to connect to the Server
// client.connect(function(err) {
//   assert.equal(null, err);
//   console.log("Connected successfully to server");

//   const db = client.db(dbName);

//   insertDocuments(db, function() {
//     client.close();
//   });
// });

// const insertDocuments = function(db, callback) {
//   // Get the documents collection
//   const collection = db.collection('documents');
//   // Insert some documents
//   collection.insertMany([
//     {a : 1}, {a : 2}, {a : 3}
//   ], function(err, result) {
//     assert.equal(err, null);
//     assert.equal(3, result.result.n);
//     assert.equal(3, result.ops.length);
//     console.log("Inserted 3 documents into the collection");
//     callback(result);
//   });
// }

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
  _client: null,
  _DB: null,
  Init: async function( { url = "mongodb://localhost:27017", name = "comfyDB" } = {} ) {
    try {
      comfyDB._client = await MongoClient.connect( url, { useNewUrlParser: true } );
      comfyDB._DB = comfyDB._client.db( name );
    }
    catch( err ) {
      console.log( "Error:", err );
    }
  },
  Close: function() {
    if( comfyDB._client ) {
      comfyDB._client.close();
      comfyDB._client = null;
      comfyDB._DB = null;
    }
  },
  Collections: {
    Create: function( name ) {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      const collection = comfyDB._DB.collection( name );
      // comfyDB._DB
    },
    List: async function() {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return await comfyDB._DB.listCollections().toArray();
    },
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

async function testComfy() {
  try {
    console.log( "initializing..." );
    await comfyDB.Init();
    console.log( "creating collection..." );
    comfyDB.Collections.Create( "test" );
    console.log( "listing collections..." );
    var collections = await comfyDB.Collections.List();
    console.log( collections );
  }
  catch( ex ) {
    console.log( ex );
  }
  finally {
    console.log( "closing..." );
    comfyDB.Close();
    process.exit();
  }
}

(async () => {
  testComfy();
})();
