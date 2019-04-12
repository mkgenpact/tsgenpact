"use strict";
var getConfig = require('./config');
var emailer = require('../emailer');
var excel = require('node-excel-export');
var fs = require('fs');
var createHandler = function (reportName,dataset){
	var config = getConfig();
	var ss 	= config.scheduler.seconds;
	var mm 	= config.scheduler.minutes;
	var hh 	= config.scheduler.hours;
	var dom = config.scheduler.day_of_month;
	var mon = config.scheduler.month;
	var dow = config.scheduler.day_of_week;
	var to 	= config.scheduler.to;
	var cc 	= config.scheduler.cc;
	var bcc = config.scheduler.bcc;
	var subject = config.scheduler.subject;
	var template = config.scheduler.template;
	try{
		
		
		var styles = {
		  headerDark: {
			fill: {
			  fgColor: {
				rgb: 'GREY'
			  }
			},
			font: {
			  color: {
				rgb: 'RED'
			  },
			  sz: 14,
			  bold: true,
			  underline: true
			}
		  },
		  cellPink: {
			fill: {
			  fgColor: {
				rgb: 'FFFFCCFF'
			  }
			}
		  },
		  cellGreen: {
			fill: {
			  fgColor: {
				rgb: 'FF00FF00'
			  }
			}
		  }
		};
		 
	//Array of objects representing heading rows (very top) 
	let heading = [
	  [{value:'Location',style:styles.cellGreen},{value:'Name',style:styles.cellGreen},{value:'EmailId',style:styles.cellGreen},{value:'Genpact Working Days',style:styles.cellGreen},{value:'Nomura Working Days',style:styles.cellGreen}]
	];
	 
	//Here you specify the export structure 
	var specification = {

	  Emp_Location: { // <- the key should match the actual data key 
		displayName: 'Location', // <- Here you specify the column header 
		headerStyle: styles.cellGreen,
		//cellStyle: function(value, row) { // <- style renderer function 
		  // if the status is 1 then color in green else color in red 
		  // Notice how we use another cell value to style the current one 
		  //return (row.status_id == 1) ? styles.cellGreen : {fill: {fgColor: {rgb: 'FFFF0000'}}}; // <- Inline cell style is possible  
		//},
		width: 120 // <- width in pixels 
	  },
	  Emp_Name: { // <- the key should match the actual data key 
		displayName: 'Employee Name', // <- Here you specify the column header 
		headerStyle: styles.cellGreen,
		//cellStyle: function(value, row) { // <- style renderer function 
		  // if the status is 1 then color in green else color in red 
		  // Notice how we use another cell value to style the current one 
		  //return (row.status_id == 1) ? styles.cellGreen : {fill: {fgColor: {rgb: 'FFFF0000'}}}; // <- Inline cell style is possible  
		//},
		width: 120 // <- width in pixels 
	  },
	  Email_Id: {
		displayName: 'Email ID',
		headerStyle: styles.cellGreen,
		//cellFormat: function(value, row) { // <- Renderer function, you can access also any row.property 
		 // return (value == 1) ? 'Active' : 'Inactive';
		//},
		width: 120 // <- width in chars (when the number is passed as string) 
	  },
	  Genpact_Working_Days: {
	  	headerStyle: styles.cellGreen,
		displayName: 'Genpact Working Days',
		//cellStyle: styles.cellPink, // <- Cell style 
		width: 120 // <- width in pixels 
	  },
	  
	  Nomura_Working_Days: {
		displayName: 'Nomura Working Days',
		headerStyle: styles.cellGreen,
		//cellStyle: styles.cellPink, // <- Cell style 
		width: 120 // <- width in pixels 
	  }
	}
	// Create the excel report. 
	// This function will return Buffer 
	var report = excel.buildExport(
	  [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report 
		{
		  name: 'Nomura TimeSheet', // <- Specify sheet name (optional) 
		  //heading: heading, // <- Raw heading array (optional) 
		  specification: specification, // <- Report specification 
		  data: dataset // <-- Report data 
		}
	  ]
	);
	
	var writeStream = fs.createWriteStream("reports/"+reportName+".xlsx");
	writeStream.write(report);
	writeStream.close();
	
	// You can then return this straight 
	//res.attachment('report.xlsx'); // This is sails.js specific (in general you need to set headers) 
	//return res.send(report);
	console.log('Generated the File Report');
		
		
	

	} catch (err){
		console.log(''+err);
	}
}
var methods = {
    create: createHandler
};
module.exports = methods;
