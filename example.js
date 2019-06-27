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
    await ComfyDB.Data.SetByKey( "test", "a", { name: "test" }, true );
    var item = await ComfyDB.Data.FindByKey( "test", "a" );
    console.log( item );
    await new Promise((res) => setTimeout(res, 1000));
    await ComfyDB.Data.SetByKey( "test", [ "a", "b", "c" ], [ { name: "A", points: 5 }, { name: "B" }, { name: "C" } ], true );
    await ComfyDB.Data.SetByKey( "test", "a", { name: "Z" }, true );
    var all = await ComfyDB.Data.FindLatest( "test" );//await ComfyDB.Data.Find( "test", {} );
    console.table( all );
    await ComfyDB.Data.Increment( "test", [ "a", "b" ], "points", 10 );
    var itemA = await ComfyDB.Data.FindByField( "test", "name", ComfyDB.Is.NotEqual, "C" );
    console.table( itemA );
    await ComfyDB.Data.Decrement( "test", [ "a", "b" ], "points", 3 );
    var itemA = await ComfyDB.Data.FindByField( "test", "name", ComfyDB.Is.NotEqual, "C" );
    console.table( itemA );
    await ComfyDB.Data.DeleteByKey( "test", "b" );
    all = await ComfyDB.Data.FindLatest( "test" );//await ComfyDB.Data.Find( "test", {} );
    console.table( all );
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
    // process.kill( process.pid, "SIGTERM" );
  }
}

// (async () => {
//   testComfy();
// })();
testComfy();
