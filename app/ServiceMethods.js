var fs = require('fs');
var registrationSheet = "REGISTRATION";
var TSSheet = "TIMESHEET";
var mysql = require('mysql');
var emailer = require('./emailer');
var getConfig = require('./common/config');
var excel = require('./common/excel-utils');

function generateMonthlyReport(month,year,connection){
	var fileName = "TimesheetReport-"+months[month];
	console.log('Report generation is in progress');
	var response = createRes();
	var dataset =[];
	var config = getConfig();

	//load the data
		connection.query("select registration.NAME, registration.OHRID,registration.LOCATION,registration.EMAIL, timesheet.CLIENT_WORKING_DAYS, timesheet.GENPACT_WORKING_DAYS from registration inner join timesheet on registration.ohrid=timesheet.ohrid and timesheet.month=? and timesheet.year=? where registration.ACTIVE = 1",[month, year],function(err, rows, fields) {
			if (!err){
				console.log('No Error '+rows.length);
				if(rows.length == 0){
					console.log('No Data found for month '+months[month]+'\' '+year);
					response.status = 'FAIL';
					response.err = 'No Data found for month '+months[month]+'\' '+year ;
				}
				for (var key = 0; key < rows.length; key++) {
				
					var d = rows[key];
					console.log(d.NAME);
					var obj = {Emp_Name: '', Email_Id: '', Genpact_Working_Days: '', Nomura_Working_Days: ''};
					obj.Emp_Name = d.NAME;
					obj.Email_Id = d.EMAIL;
					obj.Nomura_Working_Days = d.CLIENT_WORKING_DAYS;
					obj.Genpact_Working_Days = d.GENPACT_WORKING_DAYS;
					dataset.push(obj);
				};
				excel.create(fileName,dataset);
				
				var to 	= config.timesheetTemplate.pmoEmail;
				var cc 	= config.timesheetTemplate.cc;
				var bcc = config.timesheetTemplate.bcc;
				var subject = 'Nomura Onsite billing days for '+months[month]+','+year;
				var template = config.timesheetTemplate.reportTemplate;
				var replaceModel = {};
				replaceModel['MONTH'] = months[month];
				replaceModel['ADMINNAME'] = config.timesheetTemplate.adminName;
				replaceModel['PMONAME'] = config.timesheetTemplate.pmoShortName;
				emailer.sendMailWithAttachment(config.timesheetTemplate.adminAddress,to, cc, bcc, subject, template, replaceModel, fileName);
				response.status = 'success';
			}
			else {
				console.log('Error while performing Query.');
				response.status = 'FAIL';
				response.err = 'Error while performing Query' ;
			}
		});
return response;
}

function insertUpdateTsStatus(month,year,connection){
	var config = getConfig();
   var getSql ="SELECT STATUS_ID,IS_REPORT_SENT FROM TS_STATUS WHERE MONTH ="+month+" AND YEAR="+year;
   connection.query(getSql,function(err,rows,fields){
   	if(err){
   		console.log('error has occured while retrieving the TS Status ',err.stack);
   	}else{
   		if(rows.length==0){
   			console.log('insert is starting....................');
   			//fire the insert
   			var insertTsSQL ="INSERT INTO TS_STATUS(MONTH,YEAR,IS_REPORT_SENT,PMO_NAME,PMO_EMAIL) VALUES(?,?,?,?,?)";
   			connection.query(insertTsSQL,[month,year,1,config.timesheetTemplate.pmo,config.timesheetTemplate.pmoEmail],function(err,rows,fields){
   				if(err){
   					console.log('error has occured while inserting the TS_STATUS' +err.stack);
   				}else{
   					console.log('Ts_Status has been inserted with new record successfully!');
   				}
   			});
   		}else{
   			var data =rows[0];
   			console.log('update is starting...................' + data.STATUS_ID);
   			if(data.IS_REPORT_SENT ==0){
   				//fire the update
   			var updateTsSql ="UPDATE TS_STATUS SET IS_REPORT_SENT=1 WHERE STATUS_ID ="+data.STATUS_ID;
   			connection.query(updateTsSql,function(err,rows,fields){
   				if(err){
   					console.log('error has occured while updating the TS_STATUS' +err.stack);
   				}else{
   					console.log('Ts_Status has been updated successfully!');
   				}
   			});

   			}
   			
   		}
   	}
   });
};

/*function activeUsers(location){
	var activeUsers =null;
	var sql ='SELECT OHRID,EMAIL FROM REGISTRATION WHERE ACTIVE=1 AND LOCATION=?';
	connection.query(sql,[location],function(err,rows,fields){
		if(err){
			console.log('error has occured while retrieving the active users',err.stack);
		}else{
			activeUsers =rows;
		}
	});
	return activeUsers;
}*/


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

var services = {
    generateMonthlyReport: generateMonthlyReport,
	createRes: createRes,
	insertUpdateTsStatus: insertUpdateTsStatus
};
module.exports = services;

var months ={01:"January",02:"February",03:"March",04:"April",05:"May",06:"June",07:"July",08:"August",09:"Septemebr",10:"October",11:"Novemebr",12:"December"};
