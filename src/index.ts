import { Db, Filter, MongoClient, Document as mongoDocument, Sort, WithId, Condition, Collection } from "mongodb";
import type { ConnectionProperties, SearchQuery, WhereClauses, WhereClause } from "../types";

const comfyDB = {
	_mongo: null as null | MongoClient,
	_DB: null as null | Db,
	Connect: function( { url = "mongodb://localhost:27017", dbname = "comfyDB", ...options }: ConnectionProperties = {}): Promise<void> {
		return new Promise( async ( resolve, reject ) => {
			try {
				comfyDB._mongo = await MongoClient.connect( url, options );
				comfyDB._DB
				const bee = comfyDB._mongo.db( dbname );
				resolve( void 0 );
			}
			catch( err ) {
				reject( err );
			}
		});
	},
	IsConnected: function(): boolean {
		return !!comfyDB._mongo;
	},
	Close: function() {
		if( comfyDB._mongo ) {
			comfyDB._mongo.close();
			comfyDB._mongo = null;
			comfyDB._DB = null;
		}
	},
	Collections: async function(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			if( !comfyDB._DB ) {
				return reject( new Error( "No Connection" ) );
			}

			comfyDB._DB.listCollections().toArray()
				.then( list => resolve( list.map( x => x.name ) ) )
				.catch((err) => reject( err ));

		});
	},
	HasCollection: function( collection: string ) {
		return new Promise<boolean>(( resolve, reject ) => {
			if( !comfyDB._DB ) {
				return reject( new Error( "No Connection" ) );
			}
			return comfyDB.Collections()
				.then(( collections ) => {
					resolve( collections.includes( collection ) );
				})
				.catch(( e ) => {
					reject( e );
				})
		})
	},
	DeleteCollection: function( collection: string ) {
		// it didn't want to assign type by itself, had to help
		return new Promise<Awaited<ReturnType<Collection<mongoDocument>["drop"]>>>((resolve, reject) => {
			if( !comfyDB._DB ) {
				return reject( new Error( "No Connection" ) );
			}
			return comfyDB._DB.collection( collection ).drop()
			.then(( res ) => resolve( res ))
			.catch(( err ) => reject( err ));

		});
	},
	Save: async function<T extends mongoDocument>( key: String | string | string[], data: T | T[], collection = "ComfyDefault" ) {
		return comfyDB.Store( key, data, collection );
	},
	Store: async function<T extends mongoDocument>( key: String | string | string[], data: T | T[], collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		// Create an index on the key field for performance
		const innerKey = typeof key === "string" || key instanceof String ? [ (key + "") ] : key;
		if( ! await comfyDB.HasCollection( collection ) ) {
			await comfyDB._DB.createCollection( collection ).then( x => comfyDB._DB?.collection( collection ).createIndex( { "key": 1 }, { unique: true } ) );
		}
		const set = comfyDB._DB.collection( collection );
        let values: T[] = [];
        if( (typeof key === "string" || key instanceof String) && !Array.isArray(data) ) {
			values = [ { ...data, key: innerKey[0] } ];
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
		// filter createdAt field
		values.forEach( x => {
			delete x["createdAt"];
		} );

		let bulkOp = set.initializeUnorderedBulkOp();
		innerKey.forEach( ( k, i ) => bulkOp.find( { key: k } ).upsert().updateOne( {
			$set: values[ i ],
			$setOnInsert: {
				createdAt: new Date()
			}
		}) );
		return bulkOp.execute();
	},
	Get: async function( key: string, collection = "ComfyDefault" ) {
		let result = await comfyDB.Search( { key: key }, collection );
		return result ? result[ 0 ] : null;
	},
	Search: function<T extends mongoDocument>( options: null | SearchQuery<T> = null, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		const set = comfyDB._DB.collection<T>( collection );
		
		// Assign options with defaults
		let innerOptions: SearchQuery<T> = {
			sortBy: options?.sortBy || "createdAt",
			sort: options?.sort || "asc",
			limit: options?.limit || 100,
			start: options?.start || 0,
			where: null,
		};

		if (options) {
			options = {...options, count: undefined, limit: options.count || options.limit};
			innerOptions = { ...innerOptions, ...options};
		}

		// Aliases
		if( options?.orderBy ) {
			innerOptions.sortBy = options.orderBy;
		}
		
		// Sorting
		let sort: Sort = { [innerOptions.sortBy!]: innerOptions.sort!.toLowerCase().startsWith( "asc" ) ? 1 : -1 };
		
		let search = generateMongoSearchFromObject( innerOptions.where );

		if( innerOptions.key ) {
			search[ "key" ] = innerOptions.key ;
		}

		search.key = undefined;

		
		// console.log( search );

		let query = set.find<T>( search );
		query = query.skip( innerOptions.start! );
		query = query.limit( innerOptions.limit! );
		query = query.sort( sort );
		return query.toArray();
	},
	Delete: function( key: string, collection = "ComfyDefault" ) {
		return comfyDB.DeleteAll( { key: key }, collection );
	},
	DeleteAll: function<T extends mongoDocument>( options: SearchQuery<T> = {}, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		// check if key is a single string or an array for batch update
		const set = comfyDB._DB.collection( collection );
		let search = generateMongoSearchFromObject( options.where );
		if( options.key ) {
			search[ "key" ] = options.key;
		}

		let bulkOp = set.initializeUnorderedBulkOp();
		bulkOp.find( search ).delete();
		return bulkOp.execute();
	},
	Increment: function<T extends mongoDocument>( field: string, options: SearchQuery<T> | null = null, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		const set = comfyDB._DB.collection( collection );
		
		// Assign options with defaults
		const innerOptions: SearchQuery<T> = {
			by: 1,
			where: null,
			...options
		};
		let search = generateMongoSearchFromObject( innerOptions?.where );
		
		// Aliases
		if( innerOptions.key ) {
			search[ "key" ] = innerOptions.key;
		}
		// console.log( search );

		let bulkOp = set.initializeUnorderedBulkOp();
		bulkOp.find( search ).upsert().update( {
			$inc: { [field]: innerOptions.by },
			$set: {
				updatedAt: new Date()
			},
			$setOnInsert: {
				createdAt: new Date()
			},
		} );//, { upsert: true, multi: true } );
		return bulkOp.execute();
	},
	Decrement: function<T extends mongoDocument>( field: string, options: SearchQuery<T> | null = null, collection = "ComfyDefault" ) {
		const innerOptions: SearchQuery<T> = {
			by: 1,
			where: null,
			...options
		};
		innerOptions.by = -(innerOptions.by || 0);
		return comfyDB.Increment( field, innerOptions, collection );
	},
	Count: function<T extends mongoDocument>( options: SearchQuery<T> | null = null, collection = "ComfyDefault" ) {
		if( !comfyDB._DB ) { throw new Error( "No Connection" ); }
		const set = comfyDB._DB.collection( collection );
		
		// Assign options with defaults
		const innerOptions: SearchQuery<T> = {
			where: null,
			...options
		};
		
		let search = generateMongoSearchFromObject( innerOptions.where );
		// Aliases
		if( innerOptions.key ) {
			search[ "key" ] = innerOptions.key;
		}
		// console.log( search );

		return set.countDocuments(search);
	},
};

function generateMongoSearchFromObject<T extends WithId<mongoDocument>>( where: WhereClauses<T> | null | undefined ) {
	let search: Filter<T> = {};
	if (!where) {
		return search;
	}
	let field: keyof T;
	for ( field in where ) {
		const item = where[ field ];
		// Check on the first key of field for the operator
		if( !item || Object.keys( item ).length === 0 ) {
			throw new Error( `Missing Search Op for Field: ${String(field)}` );
		}

		const searchOp = (Object.keys( item )[ 0 ]).toLowerCase() as keyof WhereClause<typeof item>;
		const searchSelector = item[ searchOp ];

		if ( !searchSelector ) {
			throw new Error( `Missing value for Field: ${String(field)}` );
		}

		let operator: Condition<typeof item>;

		switch( searchOp ) {
			case "eq":
			case "equals":
			case "equal":
			case "is":
			case "isequal":
			case "isequalto":
			case "=":
				operator = { $eq: searchSelector };
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
				operator = { $ne: searchSelector };
				break;
			case "before":
			case "lessthan":
			case "lt":
			case "<":
				operator = { $lt: searchSelector };
				break;
			case "after":
			case "greaterthan":
			case "gt":
			case ">":
				operator = { $gt: searchSelector };
				break;
			case "contains":
			case "includes":
				operator = RegExp( `.*${searchSelector}.*`, "i" );
				break;
			case "starts":
			case "startswith":
			case "begins":
			case "beginswith":
			case "prefix":
				operator = RegExp( `^${searchSelector}`, "i" );
				break;
			case "ends":
			case "endswith":
			case "suffix":
				operator = RegExp( `${searchSelector}$`, "i" );
				break;
			default:
				const incorrectSignature = searchOp as string;
				throw new Error( `Unsupported Search Op: ${incorrectSignature}` );
		}
		if (operator) {
			// search[field] was somehow not allowed but this was:
			search = { ...search, [field]: operator };
		}
	}
	return search;
}

export = comfyDB;