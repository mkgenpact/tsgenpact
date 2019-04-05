// set up ======================================================================
var express  = require('express');
var app      = express(); 								// create our app w/ express
var port  	 = process.env.PORT || 8082; 				// set the port
var path = require('path');
var rewrite = require("connect-url-rewrite");
var morgan = require('morgan'); 		// log requests to the console (express4)
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var mysql = require('mysql');
var logfile = require('./app/logDetails.js');

var getConfig = require('./app/common/config');
var jobScheduler = require('./app/common/job-scheduler');
var excel = require('./app/common/excel-utils');

app.use(express.static(__dirname + '/public')); 				// set the static files location /public/img will be /img for users
app.use(morgan('dev')); 										// log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); 			// parse application/x-www-form-urlencoded
app.use(bodyParser.json()); 									// parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());


app.set('port', process.env.PORT || 8082);
app.set('views', path.join(__dirname, 'views'));

app.use(function (req, res, next) {
    res.setHeader("X-UA-Compatible", "IE=edge");
    return next();
});

app.use(function (req, res, next) {
    var userAgent = req.headers['user-agent'];
    if (userAgent != null) {
        userAgent = userAgent.toLowerCase();
		next();
    }
});

// routes ======================================================================
require('./app/service-controller.js')(app);

var config = getConfig();
if (config.app.urlPrefix) {
    var prefix = config.app.urlPrefix + '/';
    app.get(config.app.urlPrefix, function (req, res, next) {
        console.log(req.originalUrl);
        if (req.originalUrl === config.app.urlPrefix)
            res.redirect(prefix);
        else
            next();
    });
    var rewriteRule = "^" + config.app.urlPrefix + "(.*)$ $1";
    console.log(rewriteRule);
    app.use(rewrite([rewriteRule]));
}

//Scheduling the monthly reminder Emails.
jobScheduler.schedule();

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);
