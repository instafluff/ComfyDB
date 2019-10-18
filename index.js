const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');

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

/**
 * @typedef InitOptions
 * @prop {string} [url] (Currently unsued) MongoDB URL to connect to. Defaults to `"mongodb://localhost:27017"`.
 * @prop {string} [name] Name of the database to use. Defaults to `"comfyDB"`.
 */

/**
 * @typedef FindOptions
 * @prop {string} [id] Find by the `_id` field.
 * @prop {string} [key] Find by the `key` field.
 * @prop {boolean} [count] Limit the amount of results.
 * @prop {string} [sortBy] A field to sort results by. Must also set
 * `isOrderDescending`.
 * @prop {boolean} [isOrderDescending] If `sortBy` is set, choose to sort by
 * descending (`true`) or ascending (`false`).
 * @prop {string} [field] A field to compare against. Must also set `compare` and `value`.
 * @prop {"=" | "!" | "<" | "<=" | ">" | ">=" | "^" | "$" | "_" | "1" | "0"} compare
 * Compare the set `field` against a `value`. Must also set `value` and `field`.
 * - Equal: "=",
 * - Not equal: "!",
 * - Less than: "<",
 * - Less than or equal: "<=",
 * - Greater than: ">",
 * - Greater than or equal: ">=",
 * - Starts with: "^",
 * - Ends with: "$",
 * - Contains: "_",
 * - True: "1",
 * - False: "0"
 * @prop {*} [value] A value to `compare` against at `field`. Must also set `compare` and `field`.
 */

let comfyDBRunning = false;

let comfyDB = {
  _mongo: null,
  /** @type {import('mongodb').MongoClient} */
  _client: null,
  /** @type {import('mongodb').Db} */
  _DB: null,
  /**
   * Initialize the connection.
   * 
   * @param {InitOptions} options
   * @returns {Promise}
   */
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
  /**
   * Check if the database is running.
   * 
   * @returns {boolean}
   */
  IsRunning: function() {
    return comfyDBRunning;
  },
  /**
   * Close the connection and shutdown the server.
   * 
   * @param {boolean} [shouldExit] Whether or not to end the process. Defauls to true.
   */
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
  /**
   * Create a backup of the database. (TODO)
   */
  Backup: function() {
    // TODO: Backup Database
  },
  /**
   * Restore from a backup of the database. (TODO)
   */
  Restore: function() {
    // TODO: Restore Database
  },
  Collections: {
    /**
     * Create a collection in the database.
     * 
     * @param {string} name Name of the collection to create.
     * @returns {Promise<string>}
     */
    Create: async function( name ) {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return comfyDB._DB.createCollection( name ).then( x => comfyDB._DB.collection( name ).createIndex( { key: 1 }, { unique: true } ) );
    },
    /**
     * List the collections in the database.
     * 
     * @return {Promise<string[]>}
     */
    List: async function() {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return comfyDB._DB.listCollections().toArray().then( list => list.map( x => x.name ) );
    },
    /**
     * Delete/drop a collection in the database.
     * 
     * @param {string} name Name of the collection to delete.
     * @return {Promise}
     */
    Delete: async function( name ) {
      if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
      return comfyDB._DB.collection( name ).drop();
    },
  },
  Is: COMPARE,
  Data: {
    /**
     * (TODO)
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {*} options
     */
    Set: function( collection, { options } ) {
      // check if key is a single string or an array for batch update
      // TODO: Add Objects, tagging with timestamp for create/update
    },
    /**
     * Set data in the database by a key name.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string | string[]} key Key or array of keys to save data to.
     * @param {* | []} data Data to save to the key. If `key` is an array,
     * data must also be an array that matches the length of the `key` array.
     * @param {*} [overwrite] Whether or not to overwrite existing data in the
     * database. Defaults to true.
     * @returns {Promise<import("mongodb").BulkWriteResult | import("mongodb").InsertWriteOpResult>}
     */
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
    /**
     * (TODO)
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {*} options
     */
    Delete: function( collection, { options } ) {
      // check if key is a single string or an array for batch update
      // TODO: Delete objects
    },
    /**
     * Delete data in the database by key name.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string | string[]} key Key or array of keys to delete data at.
     * @returns {Promise<import("mongodb").BulkWriteResult>}
     */
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
    /**
     * Increment a value at field of key in the database.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string | string[]} key Key or array of keys to increment.
     * @param {string} field Field of key to increment.
     * @param {number} amount Amount to increment field.
     * @returns {Promise<import("mongodb").BulkWriteResult>}
     */
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
    /**
     * Decrement a value at field of key in the database.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string | string[]} key Key or array of keys to decrement.
     * @param {string} field Field of key to decrement.
     * @param {number} amount Amount to decrement field.
     * @returns {Promise<import("mongodb").BulkWriteResult>}
     */
    Decrement: function( collection, key, field, amount ) {
      return comfyDB.Data.Increment( collection, key, field, -amount );
    },
    /**
     * Query data in the database by some options.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {FindOptions} options Options for the find query.
     * @returns {Promise<any[]>}
     */
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
    /**
     * Query data in the database by its document `_id`.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string} id A document _id value.
     * @returns {Promise<any[]>}
     */
    FindById: function( collection, id ) {
      return comfyDB.Data.Find( collection, { id } );
    },
    /**
     * Query data in the database by its document `_id`.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string} id A document _id value.
     * @returns {Promise<any[]>}
     */
    FindByKey: function( collection, key ) {
      return comfyDB.Data.Find( collection, { key } );
    },
    /**
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string} field Name of the field to find by.()
     * @param {"=" | "!" | "<" | "<=" | ">" | ">=" | "^" | "$" | "_" | "1" | "0"} compare Compare the set `field` against a `value`. See Find. Defaults to True.
     * @param {*} [value] Value to find by when comparing. Defaults to "".
     * @param {number} [count] Limit the amount of results. Defaults to 100.
     * @param {boolean} [descending] If the results should be sorted by
     * descending order. Defaults to true.
     * @returns {Promise<any[]>}
     */
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
    /**
     * Get the last `count` items in a collection.
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {number} [count] Limit the amount of results in the response.
     * Defaults to 100.
     * @returns {Promise<any[]>}
     */
    FindLatest: function( collection, count = 100 ) {
      return comfyDB.Data.Find( collection, {
        sortBy: "updatedAt",
        isOrderDescending: true,
        count,
      } );
    },
    /**
     * 
     * @param {string} collection Name of the collection in the database.
     * @param {string} field Name of the field to count.
     * @param {string} [compare] Compare operator. See Find. Defaults to True.
     * @param {*} [value] Value to compare against. Defaults to "".
     * @returns {Promise<number>}
     */
    Count: function( collection, field, compare = COMPARE.True, value = "" ) {
      // TODO: Optimize!!!
      return comfyDB.Data.FindByField( collection, field, compare, value ).length;
    },
  },
};

module.exports = comfyDB;
