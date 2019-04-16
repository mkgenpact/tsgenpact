var fs = require('fs');
var registrationSheet = "REGISTRATION";
var TSSheet = "TIMESHEET";
var mysql = require('mysql');
var emailer = require('./emailer');
var getConfig = require('./common/config');
var excel = require('./common/excel-utils');
var connectionVar =require('./databaseDetails.js');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
//var request = require('request'); 
var serviceMthod =require('./serviceMethods');
var multer  = require('multer');
var async = require('async');
var excelbuilder = require('msexcel-builder');


//file upload multer setting start
 var storage = multer.diskStorage({ //multers disk storage settings
         destination: function (req, file, cb) {
             cb(null, 'uploads/')
         },
         filename: function (req, file, cb) {
             var datetimestamp = Date.now();
             cb(null, file.originalname);
         }
     });

 var upload = multer({ //multer settings
                     storage: storage
                 }).single('file');

  //end of file upload multer setiing


/*//data base connection check
var connection =connectionVar.getConnetion();
connection.connect(function(err){
		if(!err) {
			console.log("Database is connected ... nn");    
		} else {
			console.log("Error connecting database ... nn");    
		}
		return connection;
	});*/

//get the connectionPool Object on load this page
let connectionPool = connectionVar.getConnectionPool();


module.exports = function(app) {

	app.post('/api/config', function(req, res) {
		var response = { config: [], status: '' };
		var config = getConfig();
		response.config = config;
		response.status = 'success';
		res.send(response);
	});

	app.post('/api/authenticate', function(req, res) {
		var user = req.body.ohrId;
		var pass = req.body.pass;
		var type = req.body.userType;
		var response = createRes();
		var sqlQuery = null;
		var empType = 0;
		if(type == 0){
			sqlQuery = "select "+RegSelectColumns+" from REGISTRATION where OHRID = ?";
		} else {
			sqlQuery = "select "+adminColumns+" from TS_ADMIN where OHRID = ?";
			empType = 1;
		}
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query(sqlQuery,[user], function(err, rows, fields) {
					if (!err){
						var response = createRes();
						if(rows.length == 0){
							response.status = 'FAIL';
							response.err = 'User `'+user +'` not registered' ;
							res.send(response);
							return;
						}
						if(rows[0].PASSWORD == pass){
							response = getRegData(rows[0]);
							response.type = empType;
							response.status = 'success';
						}
					}
					else
						console.log('Error while performing Query.'+err);
					if(response.status == 'success'){
						console.log('Authenticated Successfully : '+response.name + ' ' + response.type)
						res.send(response);
					} else {
						console.log(user +' could not authenticate '+response.status);
						response.status = 'FAIL';
						response.err = user +' could not be authenticated' ;
						res.send(response);
					}
				});
				connection.release();
			}
		});

	});
	
	app.post('/api/wdays', function(req, res) {
		var month = req.body.month.id;
		var ohrId = req.body.ohrId;
		var year =  req.body.year;
		console.log("month==="+month);
		console.log("year ==" +year);
		var response = {month: '', clientDays: '', genpactDays: '', wdays: '', status: '', err: '',leaveTaken: ''};
		//select w.working_days, t.* from working_days w left join timesheet t on w.month = t.month where w.month = ?
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("select "+TimesheetColumns+" from timesheet where MONTH = ? and YEAR = ? and ohrid = ?",[month,year,ohrId], function(err, rows, fields) {
					if (!err){
						if(rows.length > 0){
							response.status = 'EXIST';
							response.err = 'Data Already exisits for '+monthName[month];
							response.clientDays = rows[0].CLIENT_WORKING_DAYS;
							response.genpactDays = rows[0].GENPACT_WORKING_DAYS;
							response.leaveTaken = rows[0].NO_OF_LEAVE;
							console.log('no of leave fff.' +rows[0].NO_OF_LEAVE);
							res.send(response);
							return;
						}else{
							response.status ='success';
							res.send(response);
							return;
						}

					}
					else
						console.log('Error while performing Query.'+err);
				});
				connection.release();
			}
		});
	});

	
	app.post('/api/graphdata', function(req, res) {
		var column = req.body.compareVal;
		var resp = {
			count: [],
			val: [],
			status: '',
			err: ''
		};
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("select count(*) as COUNT, "+column+" as VALUE from registration group by "+column, function(err, rows, fields) {
					if (!err){
						if(rows.length > 0){
							for (var key = 0; key < rows.length; key++) {
						//var d = {count: rows[key].COUNT, name: rows[key].VALUE};
						resp.count.push(rows[key].COUNT);
						resp.val.push(rows[key].VALUE);
					}
					resp.status = 'success';
					res.send(resp);
					return;
				}
			}
			else
				console.log('Error while performing Query.');
		});
				connection.release();
			}
		});
		
	});
	
	app.post('/api/attrdata', function(req, res) {
		var column = req.body.compareVal;
		var resp = {
			count: [],
			val: [],
			status: '',
			err: ''
		};
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("SELECT YEAR(OFF_BOARD_DATE) AS y, MONTH(OFF_BOARD_DATE) AS m, COUNT(ohrid) FROM registration GROUP BY m", function(err, rows, fields) {
					if (!err){
						if(rows.length > 0){
							for (var key = 0; key < rows.length; key++) {
						//var d = {count: rows[key].COUNT, name: rows[key].VALUE};
						resp.count.push(rows[key].COUNT);
						resp.val.push(rows[key].VALUE);
					}
					resp.status = 'success';
					res.send(resp);
					return;
				}
			}
			else
				console.log('Error while performing Query.');
		});
				connection.release();
			}
		});
	});
	
	app.post('/api/register', function(req, res) {
		var response = createRes();
		var model = req.body;
		console.log(model.ohrId+':'+model.name+':'+ model.type+':'+ model.pass+':'+model.location+':'+model.active+':'+model.team+':'+model.email+':'+ model.startDt);
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("INSERT INTO REGISTRATION (OHRID, NAME, TYPE ,PASSWORD , LOCATION , ACTIVE ,TEAM , EMAIL, ON_BOARD_DATE, LASTUPDDT ) values (?,?,?,?,?,?,?,?,STR_TO_DATE(?, '%d-%b-%Y'), now())",
					[model.ohrId,model.name, model.type, model.pass,model.location,model.active,model.team,model.email, model.startDt], function(err, rows, fields) {
						if (!err){
							console.log('Succesfully created the row: ', rows);
							response.status = 'success';
							var replaceModel = {};
							replaceModel['R_OHRID'] = model.ohrId;
							replaceModel['R_FULLNAME'] = model.name;
							replaceModel['R_LOCATION'] = model.location;
							replaceModel['R_TEAM'] = model.team;
							emailer.sendMail(adminData.email,model.email,'', 'New User created ' + model.name, 'register', replaceModel);
						}
						else
							console.log('Error while performing Query.');

						if(response.status == 'success'){
							res.send(response);
						} else {
							console.log('Could register the employee '+response.status);
							response.status = 'FAIL';
							response.err = ' could not be registered' ;
							res.send(response);
						}
					});
				connection.release();
			}
		});
	});
	app.post('/api/update/emp', function(req, res) {
		var response = createRes();
		var model = req.body;
		console.log('Active or not: '+model.active);
		console.log('off borading date :'+model.endDt);
		console.log('on borading date :'+model.startDt);

		if(model.endDt==''){
			model.endDt = null;
		}
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("UPDATE REGISTRATION SET NAME = ?, LOCATION = ?, TEAM = ?, EMAIL = ?, ACTIVE = ?, OFF_BOARD_DATE = ?, CONTACT = ?, LASTUPDDT=now() WHERE OHRID = ?",
					[model.name,model.location, model.team, model.email, model.active, model.endDt, model.contact, model.ohrId], function(err, rows, fields) {
						if (!err){
							console.log('Succesfully updated the data for: ', model.name);
							response.status = 'success';
						}
						else
							console.log('Error while performing Query.' +err);

						if(response.status == 'success'){
							res.send(response);
						} else {
							response.status = 'FAIL';
							response.err = model.name +' could not be updated' ;
							res.send(response);
						}
					});
				connection.release();
			}
		});
	});
	
	app.post('/api/remove/emp', function(req, res) {
		var response = createRes();
		var model = req.body;
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("UPDATE REGISTRATION SET ACTIVE = 0, OFF_BOARD_DATE = now(), LASTUPDDT = now() WHERE OHRID = ?",[model.ohrId], function(err, rows, fields) {
					if (!err){
						console.log('Succesfully removed the data for: ', model.name);
						response.status = 'success';
					}
					else
						console.log('Error while performing Query.');

					if(response.status == 'success'){
						res.send(response);
					} else {
						response.status = 'FAIL';
						response.err = model.name +' could not be updated' ;
						res.send(response);
					}
				});
				connection.release();
			}
		});
	});
	
	app.post('/api/reminder', function(req, res) {
		var response = createRes();
		var model = req.body;

		response.status = 'success';
		var replaceModel = {};
		replaceModel['R_FULLNAME'] = model.name;
		emailer.sendMail(model.email,'','', 'Reminder - Timesheet report ', 'reminder', replaceModel);
		res.send(response);
	});

	app.post('/api/resetPasswordEmail',function(req,res){
		var response =createRes();
		var model =req.body;

		var replaceModel = {};
		replaceModel['OHRID']=model.ohrId;

		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("SELECT PASSWORD FROM registration WHERE OHRID="+model.ohrId+" AND EMAIL='"+model.email+"'",function(err,rows,fields){
					if(!err && rows.length>0){
						response.status = 'success';
						replaceModel['PASSWORD'] =rows[0].PASSWORD;
						emailer.sendMail(model.email,'','', 'Reset Password Email', 'passwordEmail', replaceModel);
						res.send(response);
					}else{
						console.log('Error has occured while fetching the passowrd' +err);
						response.status = 'FAIL';
						res.send(response);
					}

				});
				connection.release();
			}
		});
		
	});

	app.get('/api/viewAllTimesheet',function(req,res){
		var response =createTSRes();

		connectionPool.getConnection(function(error,connection){
		if(error){
			console.log("error occured while getting connection " +error);
			connection.end();
		}else{
			connection.query("select "+TimesheetColumns+" from TIMESHEET",null,function(err,rows,fields){
				if(err){
					connection.end();
					console.log('Error while performing Query.');
					response.err = user +' could not be collected' ;
				}else{
					var count=1;
					for (var key = 0; key < rows.length; key++) {
						var d = {month: '', monthName: '', year: '', clientDays: '', genpactDays: '', lstUpdDt: ''};
						d.ohrId =rows[key].OHRID;
						d.name =rows[key].NAME;
						d.monthName = monthName[rows[key].MONTH];
						d.month = rows[key].MONTH;
						d.year = rows[key].YEAR;
						d.clientDays = rows[key].CLIENT_WORKING_DAYS;
						d.genpactDays = rows[key].GENPACT_WORKING_DAYS;
						d.lstUpdDt = rows[key].LASTUPDDT;
						response.data.push(d);
						count++;
						response.status = 'success';
						console.log('Reached here '+count);
					}
				}
				res.send(response);
			});
			connection.release();
		}
	});

	});
	
	
	app.post('/api/register/emp', function(req, res) {
		console.log('New employee registration is in process....');
		var response = createRes();
		var model = req.body;
		//check if ohrId Exis
		//var RegInsertColumns = " OHRID, NAME, PASSWORD, LOCATION, ACTIVE, TEAM, EMAIL, CONTACT, ROLE, P_LANG, S_LANG, TOOLS, DOMAIN, OS, ON_BOARD_DATE, OFF_BOARD_DATE  ";

		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("INSERT INTO REGISTRATION ("+RegInsertColumns+") values (?,?,?,?,?,?,?,?,?,?,?,?,?,?, STR_TO_DATE(?, '%d-%m-%Y'), now(),?,?,?)",
					[model.ohrId,model.name, model.pass, model.location, 1, model.team, model.email, model.contactMobile,model.role,model.priLang.id, model.otherLang, model.tools,model.domain, model.os, model.startDt,
					model.otherTools,model.otherRoles,model.otherDomains], function(err, rows, fields) {
						if (!err){
							console.log('Succesfully created the row: ', rows);
							response.status = 'success';
							var replaceModel = {};
							replaceModel['R_OHRID'] = model.ohrId;
							replaceModel['R_FULLNAME'] = model.name;
							replaceModel['R_LOCATION'] = model.location;
							replaceModel['R_TEAM'] = model.team;
							emailer.sendMail(model.email,adminData.email,'', 'Registration Complete - ' + model.name, 'register', replaceModel);
						}
						else
							console.log('Error while performing Query.' +err);

						if(response.status == 'success'){
							res.send(response);
						} else {
							console.log('Could not Register '+response.status);
							response.status = 'FAIL';
							response.err = 'Could not Register' ;
							res.send(response);
						}
					});
				connection.release();
			}
		});

	});


	app.post('/api/register/admin',function(req , res){
		console.log(req.body);
		var model = req.body;
		var response = createRes();
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("INSERT INTO ts_admin(OHRID,NAME,PASSWORD,TYPE,ACTIVE,EMAIL,LASTUPDDT) values(?,?,?,?,?,?,now())",
					[model.ohrId,model.name,model.pass,1,1,model.email],function(err,rows,fields){
						if(err){
							var errMsg = 'Error has occured while creating admin ' +err;
							console.log(errMsg);
							response.status = 'FAIL';
							response.err = errMsg;
							res.send(response);
						}else{
							response.status = 'success'
							res.send(response);
						}
					});
				connection.release();
			}
		});
	});
	
	app.post('/api/create', function(req, res) {
		var response = createRes();
		var model = req.body;
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("INSERT INTO TIMESHEET (OHRID, NAME, MONTH, CLIENT_WORKING_DAYS, GENPACT_WORKING_DAYS, YEAR, NO_OF_LEAVE, LASTUPDDT) values (?,?,?,?,?,?,?, now())",
					[model.ohrId,model.name, model.month.id, model.clientDays, model.genpactDays, model.year,model.leaveTaken], function(err, rows, fields) {
						if (!err){
							console.log('Succesfully created the row: ', rows);
							console.log('row2 Update '+model.name+'-');
							response.status = 'success';
						}
						else
							console.log('Error while performing Query.');

						if(response.status == 'success'){
							res.send(response);
						} else {
							console.log(' could not authenticate '+response.status);
							response.status = 'FAIL';
							response.err = user +' could not be registered' ;
							res.send(response);
						}
					});
				connection.release();
			}
		});
	
	});
	
	app.post('/api/update/timesheet', function(req, res) {
		var response = createRes();
		var model = req.body;
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("UPDATE TIMESHEET SET CLIENT_WORKING_DAYS = ?, GENPACT_WORKING_DAYS = ?,NO_OF_LEAVE = ?, LASTUPDDT = now() WHERE OHRID=? and MONTH=? and YEAR=?",
					[model.clientDays, model.genpactDays,model.leaveTaken, model.ohrId, model.month.id, model.year], function(err, rows, fields) {
						if (!err){
							console.log('row2 Update '+model.name+'-');
							response.status = 'success';
						}
						else
							console.log('Error while performing Query.');

						if(response.status == 'success'){
							res.send(response);
						} else {
							console.log(' could not authenticate '+err);
							response.status = 'FAIL';
							response.err = user +' could not be registered' ;
							res.send(response);
						}
					});
				connection.release();
			}
		});
	
	});
	
	app.post('/api/empTSdata', function(req, res) {
		var user = req.body.ohrId;
		var response = createTSRes();
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("select "+TimesheetColumns+" from TIMESHEET where OHRID = ?",[user], function(err, rows, fields) {
					if (!err){
						var count = 0;
						if(rows.length ==0){
							response.err ='No data found';
						}else{

							for (var key = 0; key < rows.length; key++) {
								var d = {month: '', monthName: '', year: '', clientDays: '', genpactDays: '', lstUpdDt: '',noOfLeave: ''};
								response.ohrId = rows[key].OHRID;
								response.name = rows[key].NAME;
								d.monthName = monthName[rows[key].MONTH];
								d.month = rows[key].MONTH;
								d.year = rows[key].YEAR;
								d.clientDays = rows[key].CLIENT_WORKING_DAYS;
								d.genpactDays = rows[key].GENPACT_WORKING_DAYS;
								d.lstUpdDt = rows[key].LASTUPDDT;
								d.noOfLeave = rows[key].NO_OF_LEAVE;
								response.data.push(d);
								count++;
								response.status = 'success';
								console.log('Reached here '+count);
							}
						}
					}
					else{
						console.log('Error while performing Query.');
						response.err = user +' could not be collected' ;
					}
					res.send(response);
				});
				connection.release();
			}
		});

	});
	
	app.post('/api/allempdata', function(req, res) {
		var response = [];
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("select "+RegSelectColumns+" from REGISTRATION order by ACTIVE",function(err, rows, fields) {
					if (!err){
						for (var key = 0; key < rows.length; key++) {
							var obj = {ohrId: '', 
							name: '', 
							email: '', 
							startDt: '', 
							endDt: '', 
							team:'', 
							location:'', 
							contact: '',
							role: '',
							otherRoles:'',
							tools:'',
							otherTools:'',
							pLang:'',
							sLang:'',
							domain:'',
							otherDomains:'',
							os:''
						};
						obj.ohrId = rows[key].OHRID;
						obj.name = rows[key].NAME;
						obj.email = rows[key].EMAIL;
						obj.startDt = rows[key].ON_BOARD_DATE;
						obj.endDt = rows[key].OFF_BOARD_DATE;
						obj.active = rows[key].ACTIVE;
						obj.team = rows[key].TEAM;
						obj.location = rows[key].LOCATION;
						obj.contact = rows[key].CONTACT;
						obj.pLang =rows[key].P_LANG;
						obj.sLang =rows[key].OTHER_LANG;
						obj.tools =rows[key].TOOLS;
						obj.otherTools =rows[key].OTHER_TOOLS;
						obj.domain =rows[key].DOMAIN;
						obj.otherDomains =rows[key].OTHER_DOMAIN;
						obj.os =rows[key].OS;
						obj.role =rows[key].ROLE;
						obj.otherRoles =rows[key].OTHER_ROLE;
						response.push(obj);
					};
				}
				else
					console.log('Error while performing Query.');

				console.log('Sending array of '+response.length);
				res.send(response);
			});
				connection.release();
			}
		});

	});
	
	app.post('/api/monthdata', function(req, res) {
		console.log('Going to execute query1 ');
		var month = req.body.month;
		var year = req.body.year;
		var response = createTSRes();
		console.log('Going to execute query ');
		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				connection.query("select registration.NAME, registration.OHRID,registration.LOCATION,registration.EMAIL, timesheet.CLIENT_WORKING_DAYS, timesheet.GENPACT_WORKING_DAYS from registration left join timesheet on registration.ohrid=timesheet.ohrid and timesheet.month=? and timesheet.year=? where registration.ACTIVE = 1",[month, year],function(err, rows, fields) {
					console.log('Year ='+year);
					if (!err){
						console.log('No Error '+rows.length);
						if(rows.length == 0){
							console.log('No Data found for month '+monthName[month]+'\' '+year);
							response.status = 'FAIL';
							response.err = 'No Data found for month '+monthName[month]+'\' '+year ;
							res.send(response);
							return;
						}
						for (var key = 0; key < rows.length; key++) {
							var d = rows[key];
							var obj={};
							var obj = {ohrId: '', name: '', month: '', year: '', clientDays: '', genpactDays: '', location: '', email:''};
							obj.month = month;
							obj.year = year;
							obj.ohrId = d.OHRID;
							obj.name = d.NAME;
							obj.clientDays = d.CLIENT_WORKING_DAYS;
							obj.genpactDays = d.GENPACT_WORKING_DAYS;
							obj.location = d.LOCATION;
							obj.email = d.EMAIL;
							response.data.push(obj);
							response.status = 'success';
						};
						res.send(response);
					}
					else {
						console.log('Error while performing Query.');
						response.status = 'FAIL';
						response.err = 'Error while performing Query' ;
						res.send(response);
					}
				});
				connection.release();
			}
		});

	});
	
	app.post('/api/email', function(req, res) {
		var response = createRes();
		var model = req.body;
		var config = getConfig();
		var to 	= config.scheduler.to;
		var cc 	= config.scheduler.cc;
		var bcc = config.scheduler.bcc;
		
		var subject = config.scheduler.subject;
		var template = config.scheduler.remindTemplate;
		var replaceModel = {};
		console.log('reminder email for ' + model.eMonth.name);
		replaceModel['MONTH'] =model.eMonth.name;
		replaceModel['HOSTNAME'] =config.applicationEnv.hostName;
		emailer.sendMail(to, cc, bcc, subject, template, replaceModel);
		response.status = 'success';
		res.send(response);
	});

	app.post('/api/sendPMOToBackendUpdate', function(req, res){
		var backendTsData = req.body;
		console.log(backendTsData);
		var fileName = "TSC-"+backendTsData.ohrId+"-"+Date.now();

		// Create a new workbook file in current working-path 
		  var workbook = excelbuilder.createWorkbook('reports/', fileName+".xlsx");
		  //calculate the row and column
		  var row = backendTsData.tsData.length +1;
		  // Create a new worksheet with 10 columns and 12 rows 
		  var sheet1 = workbook.createSheet('sheet1',6,row);
		  //sheet.set(column,row,date)
		  //set the header
		  sheet1.set(1,1,"Employee ID");
		  sheet1.set(2,1,"Date");
		  sheet1.set(3,1,"Expenditure Type");
		  sheet1.set(4,1,"Project Number");
		  sheet1.set(5,1,"Task Detail");
		  sheet1.set(6,1,"Hour");
		  sheet1.width(1, 15);
		  sheet1.width(2, 15);
		  sheet1.width(3, 15);
		  sheet1.width(4, 15);
		  sheet1.width(5, 15);
		  sheet1.width(6, 15);
         // sheet1.border(3, 1, {left:'medium',top:'medium',right:'thin',bottom:'medium'
        var counter=0;
		for(var i =2 ;i<=row; i++){
		  	 sheet1.set(1,i,backendTsData.tsData[counter].ohrId);
			 sheet1.set(2,i,backendTsData.tsData[counter].date);
			 sheet1.set(3,i,backendTsData.tsData[counter].expenditureType);
			 sheet1.set(4,i,backendTsData.tsData[counter].projectCode);
			 sheet1.set(5,i,backendTsData.tsData[counter].taskDetail);
			 sheet1.set(6,i,backendTsData.tsData[counter].hour);
			 counter++;
		  }
		  // Save it 
		 workbook.save(function(err){
		 	var response = createRes();
 				if (err){
 					response.status = 'FAIL';
 					console.log(err);
 					 res.send(response);
 				}
    			else{
                 console.log('congratulations, your workbook created');
		          response.status = 'success';
		          if(backendTsData.action == 'sendtopmo'){
		          	var config = getConfig();
		          	var to 	= config.timesheetTemplate.pmoEmail + ";" +backendTsData.email;
					var cc 	= config.timesheetTemplate.cc;
					var bcc = config.timesheetTemplate.bcc;
					var subject = 'Genpact Missing timesheet || ' +backendTsData.ohrId;
					var template = 'TSCBackendUpdt';
					var replaceModel = {};
					replaceModel['ADMINNAME'] = backendTsData.userName;
					emailer.sendMailWithAttachment(backendTsData.email,to, cc, bcc, subject, template, replaceModel, fileName);
		          	res.send(response);
		          }else{
		          	res.setHeader('Content-disposition', 'attachment; filename= '+fileName+".xlsx");
		         	res.setHeader('Content-type', 'application/vnd.ms-excel');
		         	var fileToSend = fs.readFileSync('reports/'+fileName+".xlsx");
		         	res.send(fileToSend);
		          }
		      
    			}
		});
         
	});
	
	app.post('/api/send-report', function(req, res) {
		console.log('Report generation is in progress');
		var response = createRes();
		var dataset =[];
		var model = req.body;
		var reportName = "TimesheetReport-"+model.rMonth.name;
		var config = getConfig();
		//load the data
		try{
			connectionPool.getConnection(function(error,connection){
				if(error){
					console.log("error occured while getting connection " +error);
					connection.end();
				}else{
					connection.query("select registration.NAME, registration.OHRID,registration.LOCATION,registration.EMAIL, timesheet.CLIENT_WORKING_DAYS, timesheet.GENPACT_WORKING_DAYS from registration inner join timesheet on registration.ohrid=timesheet.ohrid where registration.ACTIVE = 1 and timesheet.month=? and timesheet.year=? and registration.location in(?) order by registration.LOCATION asc",[months[model.rMonth.name], model.rYear,model.locations],function(err, rows, fields) {
						if (!err){
							console.log('No Error '+rows.length);
							if(rows.length == 0){
								console.log('No Data found for month '+model.rMonth.name+'\' '+model.rYear);
								response.status = 'FAIL';
								response.err = 'No Data found for month '+model.rMonth.name+'\' '+model.rYear ;
								res.send(response);
								return;
							}
							for (var key = 0; key < rows.length; key++) {

								var d = rows[key];
								console.log(d.NAME);
								var obj = {Emp_Location: '', Emp_Name: '', Email_Id: '', Genpact_Working_Days: '', Nomura_Working_Days: ''};
								obj.Emp_Name = d.NAME;
								obj.Email_Id = d.EMAIL;
								obj.Nomura_Working_Days = d.CLIENT_WORKING_DAYS;
								obj.Genpact_Working_Days = d.GENPACT_WORKING_DAYS;
								obj.Emp_Location = d.LOCATION;
								dataset.push(obj);
							};
							excel.create(reportName,dataset);

							var to 	= config.timesheetTemplate.pmoEmail;
							var cc 	= config.timesheetTemplate.cc;
							var bcc = config.timesheetTemplate.bcc;
							var subject = 'Nomura Onsite billing days for '+model.rMonth.name+','+model.rYear;
							var template = config.timesheetTemplate.reportTemplate;
							var replaceModel = {};
							replaceModel['MONTH'] = model.rMonth.name;
							replaceModel['ADMINNAME'] = config.timesheetTemplate.adminName;
							replaceModel['PMONAME'] = config.timesheetTemplate.pmoShortName;
							emailer.sendMailWithAttachment(config.timesheetTemplate.adminAddress,to, cc, bcc, subject, template, replaceModel, reportName);
							serviceMthod.insertUpdateTsStatus(model.rMonth.id,model.rYear,connection);
							response.status = 'success';
							res.send(response);
						}
						else {
							console.log('Error while performing Query.');
							response.status = 'FAIL';
							response.err = 'Error while performing Query' ;
							res.send(response);
						}
					});
					connection.release();
				}
			});
		}catch(err){
			console.log('error has occured while sending report :-' +err);
		}
		
	});

	app.post('/api/uploadTimesheet',function(req,res){
		console.log('uploading the timesheet');

		connectionPool.getConnection(function(error,connection){
			if(error){
				console.log("error occured while getting connection " +error);
				connection.end();
			}else{
				upload(req,res,function(err){
					if(err){
						res.json({error_code:1,err_desc:err});
						return;
					}
					console.log(req.file.filename);
					try{
						var exceltojson;

						if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
							exceltojson = xlsxtojson;
						} else {
							exceltojson = xlstojson;
						}
						var date =validateFileName(req.file.filename);
						console.log(date.year);
						console.log(date.month);
						exceltojson({
							input : req.file.path,
							output : null,
							lowerCaseHeaders : true
						},function(err,result){
					/*if(err){
						throw err;
					}*/

					async.waterfall([
						function(callback){
							var dataValidated =true;
						//res.json({error_code:0,err_desc:dataValidated});*/
						try{
							callback(null,result,dataValidated)
						}catch(err){
							console.log(err);
						}
						
					},
					function(jsonData,dataValidated,callback) {
						console.log('function1');
						var sqlTsStatus ="SELECT IS_REPORT_SENT FROM TS_STATUS WHERE MONTH ="+date.month+ " AND YEAR="+date.year;
						connection.query(sqlTsStatus,function(err,rows,fields){
							
							if(rows.length == 0){
								callback(null,jsonData);
							}else{
								callback("For Month = "+date.month+ ",Year = "+date.year+ " timsheet exist in system",jsonData);
							}
							
						});
					},
					function(jsonData,callback) {
						console.log('function2');
						var employeeList=[];
						async.forEachOf(jsonData, function(value,key,callback){

							var sqlQuery = "select "+RegSelectColumns+" from REGISTRATION where OHRID ="+value.ohr_id;
							connection.query(sqlQuery,function(err,rows,fields){
								if(err){
									console.log(err);
									return callback(err);
								}else{
									if(rows.length==0){
										resultText ="OHR ID = "+value.ohr_id+" in uploaded file, dose not exist";
										return callback(resultText);
									}else{
										employeeList[key] =rows[0];
										callback(null,jsonData,employeeList);
									}
								}
							});
							
						},function(err){
							if (err) console.log('error has occured' +err);
							callback(err,jsonData,employeeList);
							//callback(null,jsonData,result);
						}
						);

					},
					function(jsonData,employeeList,callback) {
						console.log('function3');
						var sql = "INSERT INTO TIMESHEET (OHRID, NAME, MONTH, CLIENT_WORKING_DAYS, GENPACT_WORKING_DAYS, YEAR, LASTUPDDT) VALUES ?";
						var timesheetArray=[];
						for(i in jsonData){
							var timesheet=[jsonData[i].ohr_id,jsonData[i].name,date.month,jsonData[i].nomura_working_days,
							jsonData[i].genpact_working_days,date.year,new Date().toISOString().slice(0, 10)];
							timesheetArray[i] =timesheet;

						}
						connection.query(sql, [timesheetArray], function(err) {
							if (err) {
								callback(err, 'done');
							}
						});

						callback(null, 'done');
					}
					], function (err, result) {
						if(err){
							console.log("Error has occured "+err);
							res.json({error_code:1,err_desc:err});
							return;
						}else{
							res.json({error_code:0,err_desc:result});
							return;
						}
					});

					
				});
					}catch(err){
						console.log("error has occured while inserting the timesheet in database " +err);
						res.json({error_code:1,err_desc:err});
						return;
					}
				})
				connection.release();
			}
		});
   });



var validateFileName = function(fileName){
	var date ={
		year : '',
		month :''
	}
	try{
		var file = fileName.split('-');
		var dateFormat =file[1].split('.');
		var dateSplit =dateFormat[0].split('_');
		date.year = dateSplit[0];
		date.month = dateSplit[1];
		return date;
	}catch(err){
		console.log('incorrect name format' +err);
		throw err;
	}
}

	// application -------------------------------------------------------------
	app.get('*', function(req, res) {
		res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
		//app.get('/public/index.html', function(req, res){

	//});
	});

	var createRes = function(){
		var resp = {
			ohrId: '',
			name: '',
			type: '',
			active: '',
			email: '',
			adminEmail: '',
			status: '',
			err: ''
		};
		return resp;
	};
	var d = {month: '', clientDays: '', genpactDays: ''};
	var createTSRes = function(){
		var resp = {
			ohrId: '',
			name: '',
			data: [],
			status: '',
			err: ''
		};
		return resp;
	};
	
	var getRegData = function(row){
		return resp = {
			ohrId: row.OHRID,
			name: row.NAME,
			type: '',
			active: row.ACTIVE,
			location: row.LOCATION, 
			team: row.TEAM, 
			email: row.EMAIL, 
			contact: row.CONTACT, 
			role: row.ROLE, 
			pLang: row.P_LANG, 
			sLang: row.OTHER_LANG, 
			tools: row.TOOLS, 
			domain: row.DOMAIN, 
			os: row.OS, 
			startDt: row.ON_BOARD_DATE, 
			endDt: row.OFF_BOARD_DATE,
			otherDomains: row.OTHER_DOMAIN,
			otherRoles: row.OTHER_ROLE,
			otherTools: row.OTHER_TOOLS,
			status: '',
			err: ''
		};
	}

	var adminColumns = " OHRID, NAME, PASSWORD, TYPE, ACTIVE, EMAIL "
	var adminData = {ohrId:'', name:'', email:[]};
	connectionPool.getConnection(function(error,connection){
		if(error){
			console.log("error occured while getting connection " +error);
			connection.end();
		}else{
			connection.query("SELECT "+adminColumns+" FROM TS_ADMIN",function(err, rows, fields) {
				if (!err){
					if(rows.length == 0){
						console.log('Admin does not exist, the emails will not be sent. Please create an Admin');
					}
					for (var key = 0; key < rows.length; key++) {
						var data = rows[key];
						adminData.ohrId = data.OHRID;
						adminData.email.push(data.EMAIL);
						adminData.name = data.NAME;
					};
				}
				else
					console.log('Error while performing Query.'+err);
			});
			connection.release();
		}
	});

	
	var months ={January:01,February:02,March:03,April:04,May:05,June:06,July:07,August:08,September:09,October:10,November:11,December:12};
	var RegSelectColumns = " OHRID, NAME, PASSWORD, LOCATION, ACTIVE, TEAM, EMAIL, CONTACT, ROLE, P_LANG, OTHER_LANG, TOOLS, DOMAIN, OS, DATE_FORMAT(ON_BOARD_DATE, '%d-%b-%Y') as ON_BOARD_DATE, DATE_FORMAT(OFF_BOARD_DATE, '%d-%b-%Y') as OFF_BOARD_DATE,OTHER_TOOLS,OTHER_ROLE,OTHER_DOMAIN ";
	var RegInsertColumns = " OHRID, NAME, PASSWORD, LOCATION, ACTIVE, TEAM, EMAIL, CONTACT, ROLE, P_LANG, OTHER_LANG, TOOLS, DOMAIN, OS, ON_BOARD_DATE, LASTUPDDT,OTHER_TOOLS,OTHER_ROLE,OTHER_DOMAIN  ";
	var monthName ={01:"January",02:"February",03:"March",04:"April",05:"May",06:"June",07:"July",08:"August",09:"September",10:"October",11:"Novemebr",12:"December"};
	
	var TimesheetColumns = " OHRID, NAME, MONTH, CLIENT_WORKING_DAYS, GENPACT_WORKING_DAYS, YEAR, NO_OF_LEAVE, DATE_FORMAT(LASTUPDDT, '%d-%b-%Y') as LASTUPDDT ";
	var WorkDaysColumns = " MONTH, WORKING_DAYS ";
};


//check the ts_staus check , if the timesheet has been sent to pmo then exit
//otherwise check the timesheet and generate the report if all timesheet has been filled up
//if not then send the remider whoever not filled.
module.exports.autoReportGeneration = function(month,year,location){
//var connetionVar =connection.getConnetion();
	console.log("Month ==" +month+ " , year == " +year);
	var config =getConfig();
	console.log('need to check the employee timehsheet',+month+ ' ' +year);
	var result;
	try{
		var sqlTsStatus ="SELECT IS_REPORT_SENT FROM TS_STATUS WHERE MONTH ="+month+ " AND YEAR="+year;
	console.log("query is =" +sqlTsStatus);
	connectionPool.getConnection(function(error,connection){
		if(error){
			console.log("error occured while getting connection " +error);
			connection.end();
		}else{
			connection.query(sqlTsStatus,function(err,rows,fields){
				if(err){
					console.log('error has occcured while fetching the timesheet statues records on autoReportGeneration job  ' +err);
				}else{
					if(rows.length==0 || rows[0].IS_REPORT_SENT==false){
						console.log('retriveing the timehsheet...');
						var pendingTimesheetSql ="SELECT R.OHRID,R.NAME,R.EMAIL FROM REGISTRATION R WHERE R.ACTIVE=1 AND R.OHRID NOT IN(SELECT OHRID FROM TIMESHEET WHERE MONTH ="+month+" AND YEAR ="+year+")";
						console.log('query to get the employe who has not filled the timehseet ' +pendingTimesheetSql);
						connection.query(pendingTimesheetSql,function(err,rows,fields){
							if(err){
								console.log('error has occcured while fetching the timesheet records on autoReportGeneration job  ' +err);
							}else{
								if(rows.length==0){
							//send the report
							console.log('All done , please send report to PMO')
							var response = serviceMthod.generateMonthlyReport(month,year,connection);
			               	//update the TS_status table with is_sent_report flag yes
			               	serviceMthod.insertUpdateTsStatus(month,year);
			               	result ='done';
			               	return result;
			               }else{
							//send reminder email to those employee who has not filled the timesheet yet!
							var emailList =" ";
							for(var i=0;i<rows.length;i++){
								var emp =rows[i];
								emailList =emailList+emp.EMAIL+";"
							}
							console.log('sending the reminder email to =' +emailList);
							var replaceModel = {};
							replaceModel['HOSTNAME'] =config.applicationEnv.hostName;
							replaceModel['ADMINNAME'] = config.timesheetTemplate.adminName;
							emailer.email(emailList,config.scheduler.cc,config.scheduler.bcc,'Incomplete Timesheet','incompleteTimesheet',replaceModel,'Please fill the timehseet');
							result ='done';
							return result;
						}

					}});
					}else{
						var data =rows[0];
						console.log('is sent flag =' +(data.IS_REPORT_SENT==true));
						result ='done';
						return result;
					}

				}});
			connection.release();
		}
	});
	}catch(err){
		console.log("error has been occured due to following error :" +err);
	}
	
};




