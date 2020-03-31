// ComfyDB v2
//
// - Store JSON
// - Get JSON
// - Delete JSON
// - Sort & Filter JSON
// - Increment & Decrement
//
// ComfyDB.Connect( { url = "mongodb://localhost:27017", dbname = "comfyDB" } = {} );
// ComfyDB.IsConnected();
// ComfyDB.Store( "key", [{ stuff }], group = "ComfyDB" );
// ComfyDB.Get( "key", group = "ComfyDB" );
// ComfyDB.Search( options = null, group = "ComfyDB" );
// // - ComfyDB.Delete( "key", options = null, group = "ComfyDB" );
// // ComfyDB.Increment( "key", { options } = null, group = "ComfyDB" );
// // ComfyDB.Decrement( "key", { options } = null, group = "ComfyDB" );
// // ComfyDB.Count( "key", { options } = null, group = "ComfyDB" );
// ComfyDB.Close();
//
//
// ComfyDB.Get( "key" );
// ComfyDB.Get( "key", { sortBy: "created", sort: "asc", count: 100, start: 0 } );
// ComfyDB.Get( "key", { where: { name: { equals: "instafluff" } } } );
// ComfyDB.Get( "key", { where: { created: { before: datetime } } } );
// ComfyDB.Get( "key", { orderBy: "name", sort: "asc", count: 100, start: 0, where: { created: { before: datetime } } } );


const MongoClient = require( "mongodb" ).MongoClient;

let comfyDB = {
	_mongo: null,
	_DB: null,
	Connect: function( { url = "mongodb://localhost:27017", dbname = "comfyDB" } = {} ) {
		return new Promise( async ( resolve, reject ) => {
			try {
				comfyDB._mongo = await MongoClient.connect( url, { useNewUrlParser: true } );
				comfyDB._DB = comfyDB._mongo.db( dbname );
				resolve();
			}
			catch( err ) {
				reject( err );
			}
		});
	},
	IsConnected: function() {
		return !!comfyDB._mongo;
	},
	Close: function( shouldExit = true ) {
		if( comfyDB._mongo ) {
			comfyDB._mongo.close();
			comfyDB._mongo = null;
			comfyDB._DB = null;
		}
	},
	Collections: async function() {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		return comfyDB._DB.listCollections().toArray().then( list => list.map( x => x.name ) );
	},
	HasCollection: async function( collection ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		return ( await comfyDB.Collections() ).includes( collection );
	},
	DeleteCollection: function( collection ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		return comfyDB._DB.collection( collection ).drop();
	},
	Store: async function( key, data, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		// Create an index on the key field for performance
		if( ! await comfyDB.HasCollection( collection ) ) {
			await comfyDB._DB.createCollection( collection ).then( x => comfyDB._DB.collection( collection ).createIndex( { "key": 1 }, { unique: true } ) );
		}

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

		let bulkOp = set.initializeUnorderedBulkOp();
		key.forEach( ( k, i ) => bulkOp.find( { key: k } ).upsert().updateOne( {
			$set: values[ i ],
			$setOnInsert: {
				createdAt: new Date()
			}
		}, { upsert: true } ) );
		return bulkOp.execute();
	},
	Get: async function( key, collection = "ComfyDefault" ) {
		let result = await comfyDB.Search( { key: key }, collection );
		// console.log( result );
		return result ? result[ 0 ] : null;
	},
	Search: function( options = null, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		const set = comfyDB._DB.collection( collection );
		let search = {};
		let sort = null;

		// Assign options with defaults
		options = Object.assign( {
			sortBy: "createdAt",
			sort: "desc",
			count: 100,
			start: 0,
			where: null,
		}, options );

		if( options.orderBy ) {
			options.sortBy = options.orderBy;
		}

		if( options.key ) {
			search[ "key" ] = options.key;
		}

		sort = { [options.sortBy]: options.sort.toLowerCase().startsWith( "asc" ) ? 1 : -1 };
		if( options.where ) {
			Object.keys( options.where ).forEach( w => {
				// Check on the first key of field for the operator
				let searchOp = Object.keys( options.where[ w ] )[ 0 ];
				switch( searchOp.toLowerCase() ) {
					case "equals":
					case "equal":
						search[ w ] = { $eq: options.where[ w ][ searchOp ] };
						break;
					case "notequals":
					case "notequal":
					case "doesntequal":
						search[ w ] = { $ne: options.where[ w ][ searchOp ] };
						break;
					case "before":
					case "lessthan":
					case "lt":
						search[ w ] = { $lt: options.where[ w ][ searchOp ] };
						break;
					case "after":
					case "greaterthan":
					case "gt":
						search[ w ] = { $gt: options.where[ w ][ searchOp ] };
						break;
				}
			});
		}
		// console.log( search );

		let query = set.find( search );
		query = query.limit( options.count );
		query = query.sort( sort );
		return query.toArray();
	},
};

module.exports = comfyDB;
