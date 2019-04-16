
const opts ={
    errorEventName :'error',
    logDirectory :'./logs',
    fileNamePattern :'roll-<DATE>.log',
    dateFormat:'YYYY.MM.DD'
}
log = require('simple-node-logger').createRollingFileLogger( opts );
