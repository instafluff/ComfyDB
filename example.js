const ComfyDB = require( "./lib/index" );

async function testComfy() {
    try {
        console.log( "connecting..." );
        await ComfyDB.Connect(); // Defaults to { url = "mongodb://localhost:27017", dbname = "ComfyDB" }

        console.log( "isConnected:", ComfyDB.IsConnected() );

        // NOTE: All functions default to the "ComfyDB" collection

        // Clear the database
        ComfyDB.DeleteAll();

        // Add users
        console.log( "saving users..." );
        await ComfyDB.Store( "user1", { username: "Instafluff", website: "https://www.instafluff.tv", profile: "Comfiest Coder and Mug Chef!" } );
        await ComfyDB.Store( "user2", { username: "Fluffington", website: "", profile: "Fluffy, Yellow, Hamsterbear." } );
        await ComfyDB.Store( "user3", { username: "Teapup", website: "", profile: "Semi-licensed rainbow skittle tricycle pupper. I'm the greatest!" } );
        await ComfyDB.Store( "user4", { username: "Catastrophe", website: "", profile: "BOW WOW, I'm the Captain of Catastrophe. FEEL MY WRATH!" } );

        // Count users
        console.log( "user count:", await ComfyDB.Count() );

        // Get user1
        console.log( "getting user1..." );
        let user1 = await ComfyDB.Get( "user1" );
        console.log( user1 );

        // Delete user4
        console.log( "deleting user4..." );
        let user4 = await ComfyDB.Get( "user4" );
        console.log( user4 );
        await ComfyDB.Delete( "user4" );

        // Get all users
        console.log( "getting all users..." );
        let allUsers = await ComfyDB.Search();
    	console.table( allUsers );

        // Get all users with "fluff" in the username
        console.log( "getting users with 'fluff' in the username, sorted by username..." );
        let fluffUsers = await ComfyDB.Search( { sortBy: "username", sort: "asc", where: { username: { contains: "fluff" } } } );
    	console.table( fluffUsers );

        // Delete all users with "chef" in the profile
        console.log( "deleting users starting with 'comfiest' in the profile" );
        await ComfyDB.DeleteAll( { where: { profile: { startsWith: "comfiest" } } } );

        // Get all remaining users sorted by the key descending
        console.log( "getting remaining users..." );
        let remainingUsers = await ComfyDB.Search( { sortBy: "key", sort: "desc" } );
    	console.table( remainingUsers );

        // Add stat counters
        console.log( "saving stats...");
        ComfyDB.DeleteAll( null, "game-stats" );
        await ComfyDB.Store( "teapup", { hitpoints: 100, skittles: 0 }, "game-stats" );
        await ComfyDB.Store( "catastrophe", { hitpoints: 100 }, "game-stats" );

        // Get all stats
        console.log( "getting all stats..." );
        let allStats = await ComfyDB.Search( null, "game-stats" );
    	console.table( allStats );

        // Increment Teapup skittles by 10
        console.log( "incrementing Teapup's skittles by 10" );
        await ComfyDB.Increment( "skittles", { by: 10, where: { key: { equals: "teapup" } } }, "game-stats" );

        // Decrement all hitpoints by 30
        console.log( "decrementing all hitpoints by 30" );
        await ComfyDB.Decrement( "hitpoints", { by: 30 }, "game-stats" );

        // Decrement Catastrophe hitpoints by 50
        console.log( "decrementing Not-Teapup's hitpoints by 50" );
        await ComfyDB.Decrement( "hitpoints", { by: 50, where: { key: { "!": "teapup" } } }, "game-stats" );

        // Get final stats
        console.log( "getting final stats..." );
        let finalStats = await ComfyDB.Search( null, "game-stats" );
    	console.table( finalStats );
    }
    catch( ex ) {
        console.log( ex );
    }
    finally {
        console.log( "closing..." );
        ComfyDB.Close();
    }
}


// Run a self-contained MongoDB using ComfyMongoDB to run the example
const ComfyMongo = require( "comfy-mongo" )();
ComfyMongo.on( "output", ( data ) => {
    // console.log( data );
});
ComfyMongo.on( "error", ( err ) => {
    // console.log( err );
});
ComfyMongo.on( "ready", async () => {
    console.log( "[ComfyDB] Ready..." );
    await testComfy();
    ComfyMongo.shutdown();
});
ComfyMongo.on( "exit", ( code ) => {
    console.log( "[ComfyDB] Exit:", code );
});
