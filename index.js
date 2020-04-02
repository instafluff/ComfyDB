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
	Close: function() {
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
	Save: async function( key, data, collection = "ComfyDefault" ) {
		return comfyDB.Store( key, data, collection );
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
			sort: "asc",
			limit: 100,
			start: 0,
			where: null,
		}, options );

		// Aliases
		if( options.orderBy ) {
			options.sortBy = options.orderBy;
		}
		if( options.count ) {
			options.limit = options.count;
		}

		// Sorting
		sort = { [options.sortBy]: options.sort.toLowerCase().startsWith( "asc" ) ? 1 : -1 };

		if( options.where ) {
			search = generateMongoSearchFromObject( options.where );
		}
		if( options.key ) {
			search[ "key" ] = options.key;
		}
		// console.log( search );

		let query = set.find( search );
		query = query.skip( options.start );
		query = query.limit( options.limit );
		query = query.sort( sort );
		return query.toArray();
	},
	Delete: function( key, collection = "ComfyDefault" ) {
		return comfyDB.DeleteAll( { key: key }, collection );
	},
	DeleteAll: function( options = {}, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		// check if key is a single string or an array for batch update
		const set = comfyDB._DB.collection( collection );
		let search = {};
		if( options.where ) {
			search = generateMongoSearchFromObject( options.where );
		}
		if( options.key ) {
			search[ "key" ] = options.key;
		}

		let bulkOp = set.initializeUnorderedBulkOp();
		bulkOp.find( search ).remove();
		return bulkOp.execute();
	},
	Increment: function( field, options = null, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		const set = comfyDB._DB.collection( collection );
		let search = {};

		// Assign options with defaults
		options = Object.assign( {
			by: 1,
			where: null,
		}, options );

		// Aliases
		if( options.where ) {
			search = generateMongoSearchFromObject( options.where );
		}
		if( options.key ) {
			search[ "key" ] = options.key;
		}
		// console.log( search );

		let bulkOp = set.initializeUnorderedBulkOp();
		bulkOp.find( search ).upsert().update( {
			$inc: { [field]: options.by },
			$set: {
				updatedAt: new Date()
			},
			$setOnInsert: {
				createdAt: new Date()
			}
		} );//, { upsert: true, multi: true } );
		return bulkOp.execute();
	},
	Decrement: function( field, options = null, collection = "ComfyDefault" ) {
		options = Object.assign( {
			by: 1,
			where: null,
		}, options );
		options.by = -options.by;
		return comfyDB.Increment( field, options, collection );
	},
	Count: function( options = null, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		const set = comfyDB._DB.collection( collection );
		let search = {};

		// Assign options with defaults
		options = Object.assign( {
			where: null,
		}, options );

		// Aliases
		if( options.where ) {
			search = generateMongoSearchFromObject( options.where );
		}
		if( options.key ) {
			search[ "key" ] = options.key;
		}
		// console.log( search );

		let query = set.find( search );
		return query.count();
	},
};

function generateMongoSearchFromObject( where ) {
	let search = {};
	Object.keys( where ).forEach( field => {
		// Check on the first key of field for the operator
		if( Object.keys( where[ field ] ).length === 0 ) {
			throw new Error( "Missing Search Op for Field:", field );
		}
		let searchOp = Object.keys( where[ field ] )[ 0 ];
		switch( searchOp.toLowerCase() ) {
			case "eq":
			case "equals":
			case "equal":
			case "is":
			case "isequal":
			case "isequalto":
			case "=":
				search[ field ] = { $eq: where[ field ][ searchOp ] };
				break;
			case "ne":
			case "not":
			case "notequals":
			case "notequal":
			case "doesntequal":
			case "isnot":
			case "isnt":
			case "isnotequal":
			case "isnotequalto":
			case "!":
			case "!=":
			case "<>":
				search[ field ] = { $ne: where[ field ][ searchOp ] };
				break;
			case "before":
			case "lessthan":
			case "lt":
			case "<":
				search[ field ] = { $lt: where[ field ][ searchOp ] };
				break;
			case "after":
			case "greaterthan":
			case "gt":
			case ">":
				search[ field ] = { $gt: where[ field ][ searchOp ] };
				break;
			case "contains":
			case "includes":
				search[ field ] = RegExp( `.*${where[ field ][ searchOp ]}.*`, "i" );
				break;
			case "starts":
			case "startswith":
			case "begins":
			case "beginswith":
			case "prefix":
				search[ field ] = RegExp( `^${where[ field ][ searchOp ]}`, "i" );
				break;
			case "ends":
			case "endswith":
			case "suffix":
				search[ field ] = RegExp( `${where[ field ][ searchOp ]}$`, "i" );
				break;
			default:
				throw new Error( "Unsupported Search Op:", searchOp );
		}
	});
	return search;
}

module.exports = comfyDB;
