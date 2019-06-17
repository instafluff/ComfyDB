const ComfyDB = require( "./index" );

async function testComfy() {
  try {
    console.log( "initializing..." );
    await ComfyDB.Init();
    console.log( "creating collection..." );
    await ComfyDB.Collections.Create( "test" );
    console.log( "listing collections..." );
    var collections = await ComfyDB.Collections.List();
    console.log( collections );
    console.log( "deleting collection..." );
    await ComfyDB.Collections.Delete( "test" );
    console.log( "listing collections..." );
    collections = await ComfyDB.Collections.List();
    console.log( collections );
  }
  catch( ex ) {
    console.log( ex );
  }
  finally {
    console.log( "closing..." );
    ComfyDB.Close();
    process.exit();
  }
}

(async () => {
  testComfy();
})();
