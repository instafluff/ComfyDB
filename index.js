const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// // Connection URL
// const url = 'mongodb://localhost:27017';

// // Database Name
// const dbName = 'myproject';

// // Use connect method to connect to the Server
// MongoClient.connect(url, function(err, client) {
//   assert.equal(null, err);
//   console.log("Connected successfully to server");

//   const db = client.db(dbName);

//   // insertDocuments(db, function() {
//   //   client.close();
//   // });
//   client.close();
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
  Init: function( { url = "mongodb://localhost:27017", name = "comfyDB" } = {} ) {
    return new Promise( async ( resolve, reject ) => {
      try {
        // TODO: If we're not depending on the default local instance of mongo, skip booting it up
        const mongo = require( "comfy-mongo" )();
        mongo.on( "output", ( data ) => {
          // console.log( data );
        });
        mongo.on( "error", ( err ) => {
          // console.log( err );
          reject( err );
        });
        mongo.on( "ready", async () => {
          console.log( "Ready..." );
          comfyDB._client = await MongoClient.connect( url, { useNewUrlParser: true } );
          comfyDB._DB = comfyDB._client.db( name );
          resolve();
        });
        mongo.on( "exit", ( code ) => {
          console.log( "Exit:", code );
        });
      }
      catch( err ) {
        reject( err );
      }
    });
  },
  Close: function() {
    if( comfyDB._client ) {
      comfyDB._client.close();
      comfyDB._client = null;
      comfyDB._DB = null;
    }
  },
  Backup: function() {
    // TODO: Backup Database
  },
  Restore: function() {
    // TODO: Restore Database
  },
  Collections: {
    Create: async function( name ) {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return comfyDB._DB.createCollection( name ).then( x => comfyDB._DB.collection( name ).createIndex( { key: 1 }, { unique: true } ) );
    },
    List: async function() {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return comfyDB._DB.listCollections().toArray().then( list => list.map( x => x.name ) );
    },
    Delete: async function( name ) {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return comfyDB._DB.collection( name ).drop();
    },
  },
  Is: COMPARE,
  Data: {
    Set: function( collection, { options } ) {
      // check if key is a single string or an array for batch update
      // TODO: Add Objects, tagging with timestamp for create/update
    },
    SetByKey: function( collection, key, data, overwrite = true ) {
      // check if key is a single string or an array for batch update
      // TODO: Add Objects, tagging with ID and timestamp for create/update
      const set = comfyDB._DB.collection( collection );
      let values = [];
      if( typeof key === "string" || key instanceof String ) {
        values = [ { ...data, key: key } ];
        key = [ key ];
      }
      else if( Array.isArray( key ) && Array.isArray( data ) ) {
        if( key.length !== data.length ) {
          throw new Error( "Key-Data Length Mismatch" );
        }
        values = data.map( ( x, i ) => ({ ...x, key: key[ i ] }) );
      }
      else {
        throw new Error( "Invalid Argument Type" );
      }

      if( overwrite ) {
        let bulkOp = set.initializeUnorderedBulkOp();
        key.forEach( ( k, i ) => bulkOp.find( { key: k } ).upsert().updateOne( { $set: values[ i ] }, { upsert: true } ) );
        return bulkOp.execute();
      }
      else {
        return set.insertMany( values );
      }
    },
    Delete: function( collection, key ) {
      // check if key is a single string or an array for batch update
      // TODO: Delete objects
    },
    Increment: function( collection, key, field, amount ) {},
    Decrement: function( collection, key, field, amount ) {
      comfyDB.Increment( collection, key, field, -amount );
    },
    Find: function( collection, options ) {
      const set = comfyDB._DB.collection( collection );
      return set.find().toArray();
    },
    FindById: function( collection, id ) {
      comfyDB.Find( { id } );
    },
    FindByKey: function( collection, key ) {
      comfyDB.Find( { key } );
    },
    FindByField: function( collection, field, compare = COMPARE.True, value = "", count = 100, descending = true ) {
      comfyDB.Find( {
        field,
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
