const fs = require('fs');
const spawn = require("child_process").spawn;
const EventEmitter = require('events');
class MongoLocal extends EventEmitter {};

module.exports = function () {
  try {
    fs.mkdirSync( "data", { recursive: true } );
  }
  catch( err ) {
    if( err.code !== 'EEXIST' ) throw err;
  }

  const mongo = new MongoLocal();

  var mongoPath = "mongodb\\win\\mongod.exe";
  switch( process.platform ) {
    case "win32": // Windows
      mongoPath = "mongodb\\win\\mongod.exe";
      break;
    case "darwin": // OSX
      mongoPath = "mongodb/mac/mongod";
      break;
    default:
      throw new Error( "Unsupported Platform: " + process.platform );
  }

  const mongoProc = spawn( mongoPath, [ "-dbpath", "./data" ], {
    shell: true
  });

  mongoProc.stdout.on( "data", ( data ) => {
    // console.log( `OUT: ${data.toString("utf8")}` );
    mongo.emit( "output", data.toString( "utf8" ) );
    if( data.includes( "waiting for connections on" ) ) {
      mongo.emit( "ready" );
    }
  });

  mongoProc.stderr.on( "data", ( data ) => {
    // console.log( `ERR: ${data}` );
    mongo.emit( "error", data.toString( "utf8" ) );
  });

  mongoProc.on( "close", ( code ) => {
    mongo.emit( "exit", code );
    // console.log( `EXIT: ${code}` );
  });

  process.on( "exit", () => mongoProc.kill( "SIGINT" ) );

  return mongo;
}
