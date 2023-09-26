//@ts-check
const ComfyDB = require( "./lib/index" );

test( "connects to MongoDB", async () => {
	await ComfyDB.Connect();
    expect( ComfyDB.IsConnected() ).toBe( true );
});

test( "gets undefined for non-existent values", async () => {
    expect( await ComfyDB.Get( "nonexistent" ) ).toBeUndefined();
});

test( "saves and gets values", async () => {
    await ComfyDB.Store( "test", { name: "Instafluff" } );
    expect( ( await ComfyDB.Get( "test" ) )?.name ).toBe( "Instafluff" );
});

test( "deletes value", async () => {
    await ComfyDB.Delete( "test" );
    expect( await ComfyDB.Get( "test" ) ).toBeUndefined();
});

test( "sets _id", async () => {
    await ComfyDB.Store( "identifier", { name: "Instafluff" } );
    expect( ( await ComfyDB.Get( "identifier" ) )?._id ).toBeDefined();
});

test( "adds createdAt", async () => {
    await ComfyDB.Store( "created", { name: "Instafluff" } );
    expect( ( await ComfyDB.Get( "created" ) )?.createdAt ).toBeDefined();
});

test( "adds updatedAt", async () => {
    await ComfyDB.Store( "updated", { name: "Instafluff" } );
    expect( ( await ComfyDB.Get( "updated" ) )?.updatedAt ).toBeDefined();
});

test( "search returns all results", async () => {
    for( let i = 0; i < 5; i++ ) {
        await ComfyDB.Store( `test${i}`, { value: `test${i}` } );
    }
    let results = await ComfyDB.Search();
    for( let i = 0; i < 5; i++ ) {
        expect( ( await ComfyDB.Get(  `test${i}` ) )?.value ).toBe(  `test${i}` );
    }
});

test( "search returns correct results", async () => {
    for( let i = 0; i < 10; i++ ) {
        await ComfyDB.Store( `ignore${i}`, { value: `ignore${i}` } );
    }
    for( let i = 0; i < 5; i++ ) {
        await ComfyDB.Store( `search${i}`, { value: `search${i}` } );
    }
    let results = await ComfyDB.Search( { where: { value: { contains: "search" } } } );
    expect( results.length ).toBe( 5 );
    for( let i = 0; i < 5; i++ ) {
        expect( results[ i ].value ).toBe(  `search${i}` );
    }
});

test( "sorts results ascending", async () => {
    for( let i = 5; i > 0; i-- ) {
        await ComfyDB.Store( `ascending${i}`, { value: `ascending${i}` } );
    }
    let results = await ComfyDB.Search( { sortBy: "value", sort: "asc", where: { value: { contains: "ascending" } } } );
    expect( results.length ).toBe( 5 );
    for( let i = 0; i < 5; i++ ) {
        expect( results[ i ].value ).toBe(  `ascending${1 + i}` );
    }
});

test( "sorts results descending", async () => {
    for( let i = 0; i < 5; i++ ) {
        await ComfyDB.Store( `descending${i}`, { value: `descending${i}` } );
    }
    let results = await ComfyDB.Search( { sortBy: "value", sort: "desc", where: { value: { contains: "descending" } } } );
    expect( results.length ).toBe( 5 );
    for( let i = 0; i < 5; i++ ) {
        expect( results[ i ].value ).toBe(  `descending${4 - i}` );
    }
});

test( "start offsets results", async () => {
    for( let i = 0; i < 10; i++ ) {
        await ComfyDB.Store( `start${i}`, { value: `start${i}` } );
    }
    let results = await ComfyDB.Search( { start: 5, where: { value: { contains: "start" } } } );
    expect( results.length ).toBe( 5 );
    for( let i = 0; i < 5; i++ ) {
        expect( results[ i ].value ).toBe(  `start${i + 5}` );
    }
});

test( "limit limits results", async () => {
    for( let i = 0; i < 10; i++ ) {
        await ComfyDB.Store( `limit${i}`, { value: `limit${i}` } );
    }
    let results = await ComfyDB.Search( { limit: 5, where: { value: { contains: "limit" } } } );
    expect( results.length ).toBe( 5 );
    for( let i = 0; i < 5; i++ ) {
        expect( results[ i ].value ).toBe(  `limit${i}` );
    }
});

test( "count is accurate", async () => {
    for( let i = 0; i < 10; i++ ) {
        await ComfyDB.Store( `count${i}`, { value: `count${i}` } );
    }
    let result = await ComfyDB.Count( { where: { value: { contains: "count" } } } );
    expect( result ).toBe( 10 );
});

/**
 * @typedef TestValue
 * @property {string} key
 * @property {number} value
 */

test( "increment adds amount", async () => {
    for( let i = 0; i < 10; i++ ) {
        await ComfyDB.Store( `skipincrement${i}`, { value: 5 } );
    }
    for( let i = 0; i < 5; i++ ) {
        await ComfyDB.Store( `increment${i}`, { value: 5 } );
    }
    await ComfyDB.Increment( "value", { where: { key: { startsWith: "increment" } }, by: 5, } );

    let results = /** @type {TestValue[]} */ ( await ComfyDB.Search( { where: { key: { contains: "increment" } } } ) );
    expect( results.length ).toBe( 15 );
    for( let i = 0; i < 15; i++ ) {
        if( results[ i ].key.startsWith( "skip" ) ) {
            expect( results[ i ].value ).toBe( 5 );
        }
        else {
            expect( results[ i ].value ).toBe( 10 );
        }
    }
});

test( "decrement subtracts amount", async () => {
    for( let i = 0; i < 10; i++ ) {
        await ComfyDB.Store( `skipdecrement${i}`, { value: 5 } );
    }
    for( let i = 0; i < 5; i++ ) {
        await ComfyDB.Store( `decrement${i}`, { value: 5 } );
    }
    await ComfyDB.Decrement( "value", { by: 5, where: { key: { startsWith: "decrement" } } } );
    let results = /** @type {TestValue[]} */ ( await ComfyDB.Search({ where: { key: { contains: "decrement" } } } ));
    expect( results.length ).toBe( 15 );
    for( let i = 0; i < 15; i++ ) {
        if( results[ i ].key.startsWith( "skip" ) ) {
            expect( results[ i ].value ).toBe( 5 );
        }
        else {
            expect( results[ i ].value ).toBe( 0 );
        }
    }
});

var ComfyMongo = null;
var testFinishResolve = null;
beforeAll( () => {
    return new Promise( ( resolve, reject ) => {
        ComfyMongo = require( "comfy-mongo" )();
        ComfyMongo.on( "output", ( data ) => {
            // console.log( data );
        });
        ComfyMongo.on( "error", ( err ) => {
            // console.log( err );
        });
        ComfyMongo.on( "ready", async () => {
            console.log( "[ComfyDB] Ready..." );
            resolve(void 0);
        });
        ComfyMongo.on( "exit", ( code ) => {
            console.log( "[ComfyDB] Exit:", code );
            testFinishResolve();
        });
    });
});

afterAll(() => {
    return new Promise( async ( resolve, reject ) => {
        testFinishResolve = resolve;
        await ComfyDB.DeleteAll();
        ComfyMongo.shutdown();
    });
});
