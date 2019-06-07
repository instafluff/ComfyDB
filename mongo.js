const fs = require('fs');
const spawn = require("child_process").spawn;

module.exports = function () {
  try {
    fs.mkdirSync( "data", { recursive: true } );
  }
  catch( err ) {
    if( err.code !== 'EEXIST' ) throw err;
  }

  const mongoProc = spawn("mongodb\\win\\mongod.exe", [ "-dbpath", "./data" ], {
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
