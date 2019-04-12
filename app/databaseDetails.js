var mysql = require('mysql');


var getConnectionPool  = function(){
	var connectionPool = mysql.createPool({
		connectionLimit : 50,
		host     : "localhost",
		port     : "3306",
		user     : "root",
		password : "18110",
		database : "genpact_timesheet"
	});
	console.log("Initialized the DB connection");
	return connectionPool;
}
module.exports.getConnectionPool = getConnectionPool;




