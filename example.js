const ComfyDB = require( "./index" );

async function testComfy() {
  try {
    console.log( "connecting..." );
	await ComfyDB.Connect();
	console.log( "Is Connected:", ComfyDB.IsConnected() );

	console.log( "Get:", await ComfyDB.Get( "time" ) );
	console.log( "Store:", await ComfyDB.Store( "time", { date: new Date() } ) );
	console.log( "Store:", await ComfyDB.Store( "name", { name: "instafluff" } ) );
	console.log( "Get:", await ComfyDB.Get( "time" ) );
	console.log( "Search:", await ComfyDB.Search( {} ) );

	// console.table( all );
	//
	// ComfyDB.Store( "key", [{ stuff }], group = "ComfyDB" );
	// ComfyDB.Get( "key", options = null, group = "ComfyDB" );
	// - ComfyDB.Delete( "key", options = null, group = "ComfyDB" );
	// ComfyDB.Increment( "key", { options } = null, group = "ComfyDB" );
	// ComfyDB.Decrement( "key", { options } = null, group = "ComfyDB" );
	// ComfyDB.Count( "key", { options } = null, group = "ComfyDB" );
	ComfyDB.Close();
  }
  catch( ex ) {
    console.log( ex );
  }
  finally {
    console.log( "closing..." );
    ComfyDB.Close();
  }
}


const ComfyMongo = require( "comfy-mongo" )();
ComfyMongo.on( "output", ( data ) => {
  // console.log( data );
});
ComfyMongo.on( "error", ( err ) => {
  // console.log( err );
});
ComfyMongo.on( "ready", async () => {
  console.log( "[ComfyDB] Ready..." );
  testComfy();
});
ComfyMongo.on( "exit", ( code ) => {
  console.log( "[ComfyDB] Exit:", code );
});
