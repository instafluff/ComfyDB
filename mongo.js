const fs = require('fs');
const spawn = require("child_process").spawn;

module.exports = function () {
  try {
    fs.mkdirSync( "data", { recursive: true } );
  }
  catch( err ) {
    if( err.code !== 'EEXIST' ) throw err;
  }

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
    console.log( `OUT: ${data}` );
  });

  mongoProc.stderr.on( "data", ( data ) => {
    console.log( `ERR: ${data}` );
  });

  mongoProc.on( "close", ( code ) => {
    console.log( `EXIT: ${code}` );
  });

  return mongoProc;
}
