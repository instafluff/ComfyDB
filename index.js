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

let comfyDBRunning = false;

let comfyDB = {
  _mongo: null,
  _client: null,
  _DB: null,
  Init: function( { url = "mongodb://localhost:27017", name = "comfyDB" } = {} ) {
    return new Promise( async ( resolve, reject ) => {
      try {
        comfyDBRunning = false;
        // TODO: If we're not depending on the default local instance of mongo, skip booting it up
        comfyDB._mongo = require( "comfy-mongo" )();
        comfyDB._mongo.on( "output", ( data ) => {
          // console.log( data );
        });
        comfyDB._mongo.on( "error", ( err ) => {
          // console.log( err );
          if( comfyDBRunning ) {
          }
          else {
            reject( err );
          }
        });
        comfyDB._mongo.on( "ready", async () => {
          console.log( "[ComfyDB] Ready..." );
          comfyDBRunning = true;
          comfyDB._client = await MongoClient.connect( url, { useNewUrlParser: true } );
          comfyDB._DB = comfyDB._client.db( name );
          resolve();
        });
        comfyDB._mongo.on( "exit", ( code ) => {
          console.log( "[ComfyDB] Exit:", code );
          comfyDB.Close();
          comfyDBRunning = false;
        });
      }
      catch( err ) {
        reject( err );
      }
    });
  },
  Close: function( shouldExit = true ) {
    if( comfyDB._client ) {
      comfyDB._client.close();
      comfyDB._client = null;
      comfyDB._DB = null;
    }
    if( comfyDB._mongo ) {
      comfyDB._mongo.shutdown();
    }
    if( shouldExit ) {
      process.exit();
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
      // TODO: Add timestamp for create/update
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
      values = values.map( x => ({ ...x, updatedAt: new Date() } ) );

      if( overwrite ) {
        let bulkOp = set.initializeUnorderedBulkOp();
        key.forEach( ( k, i ) => bulkOp.find( { key: k } ).upsert().updateOne( {
          $set: values[ i ],
          $setOnInsert: {
            createdAt: new Date()
          }
        }, { upsert: true } ) );
        return bulkOp.execute();
      }
      else {
        return set.insertMany( values );
      }
    },
    Delete: function( collection, { options } ) {
      // check if key is a single string or an array for batch update
      // TODO: Delete objects
    },
    DeleteByKey: function( collection, key ) {
      // check if key is a single string or an array for batch update
      const set = comfyDB._DB.collection( collection );
      if( typeof key === "string" || key instanceof String ) {
        key = [ key ];
      }
      else if( Array.isArray( key ) ) {
      }
      else {
        throw new Error( "Invalid Argument Type" );
      }

      let bulkOp = set.initializeUnorderedBulkOp();
      key.forEach( ( k, i ) => bulkOp.find( { key: k } ).remove() );
      return bulkOp.execute();
    },
    Increment: function( collection, key, field, amount ) {
      const set = comfyDB._DB.collection( collection );
      let values = [];
      if( typeof key === "string" || key instanceof String ) {
        values = [ { key: key } ];
        key = [ key ];
      }
      else if( Array.isArray( key ) ) {
        values = key.map( ( x, i ) => ({ key: x }) );
      }
      else {
        throw new Error( "Invalid Argument Type" );
      }
      values = values.map( x => ({ ...x, updatedAt: new Date() } ) );

      let bulkOp = set.initializeUnorderedBulkOp();
      key.forEach( ( k, i ) => bulkOp.find( { key: k } ).upsert().updateOne( {
        $set: values[ i ],
        $inc: { [field]: amount },
        $setOnInsert: {
          createdAt: new Date()
        }
      }, { upsert: true } ) );
      return bulkOp.execute();
    },
    Decrement: function( collection, key, field, amount ) {
      comfyDB.Data.Increment( collection, key, field, -amount );
    },
    Find: function( collection, options ) {
      // TODO: Add time query for how long it took
      const set = comfyDB._DB.collection( collection );
      let search = {};
      let sort = null;
      if( options.id ) {
        search[ "_id" ] = options.id;
      }
      if( options.key ) {
        search[ "key" ] = options.key;
      }
      if( options.sortBy ) {
        if( typeof options.isOrderDescending !== undefined ) {
          sort = { [options.sortBy]: options.isOrderDescending ? -1 : 1 };
        }
      }
      if( options.field ) {
        switch( options.compare ) {
          case COMPARE.Equal:
            search[ options.field ] = { $eq: options.value };
            break;
          case COMPARE.NotEqual:
            search[ options.field ] = { $ne: options.value };
            break;
          case COMPARE.LessThan:
            search[ options.field ] = { $lt: options.value };
            break;
          case COMPARE.LessThanOrEqual:
            search[ options.field ] = { $lte: options.value };
            break;
          case COMPARE.GreaterThan:
            search[ options.field ] = { $gt: options.value };
            break;
          case COMPARE.GreaterThanOrEqual:
            search[ options.field ] = { $gte: options.value };
            break;
            // TODO: Add the remaining comparisons!
            // StartsWith: "^",
            // EndsWith: "$",
            // Contains: "_",
            // True: "1",
            // False: "0"
        }
      }

      // console.log( search );

      let query = set.find( search );
      if( options.count ) {
        query = query.limit( options.count );
      }
      if( sort ) {
        query = query.sort( sort );
      }
      return query.toArray();
    },
    FindById: function( collection, id ) {
      return comfyDB.Data.Find( collection, { id } );
    },
    FindByKey: function( collection, key ) {
      return comfyDB.Data.Find( collection, { key } );
    },
    FindByField: function( collection, field, compare = COMPARE.True, value = "", count = 100, descending = true ) {
      // TODO: Support an array of fields and comparisons
      return comfyDB.Data.Find( collection, {
        field,
        compare,
        value,
        count,
        sortBy: field,
        isOrderDescending: descending
      });
    },
    FindLatest: function( collection, count = 100 ) {
      return comfyDB.Data.Find( collection, {
        sortBy: "updatedAt",
        isOrderDescending: true,
        count,
      } );
    },
    Count: function( collection, field, compare = COMPARE.True, value = "" ) {
      // TODO: Optimize!!!
      return comfyDB.Data.FindByField( collection, field, compare, value ).length;
    },
  },
};

module.exports = comfyDB;
