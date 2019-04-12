"use strict";
var cron = require('node-cron');
var getConfig = require('./config');
var emailer = require('../emailer');
var https = require('https');
var app =require('../service-controller.js');


var scheduleHandler = function (){
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
	cron.schedule(ss+" "+mm+" "+hh+" "+dom+" "+mon+" "+dow, function(){
		var replaceModel = {};
		emailer.sendMail(to, cc, bcc, subject, template, replaceModel);
	});
	} catch (err){
		console.log(''+err);
	}
}

var timesheetJob =function(){
	try{
		var config = getConfig();
		var mm='30';
		var hh='08';
		var dom='27-30';
		var mon='*';
		var dow='*';
		var location =config.scheduler.location;
		cron.schedule(mm+" "+hh+" "+dom+" "+mon+" "+dow,function(){
			var date =new Date();
			var month =date.getMonth();
			var year =date.getFullYear();
			var monthNumber = date.getMonth() -1;
			var decemberDate;
			if(monthNumber == -1){
				//if month number is in -1 , it means new year(january) has come
				// so to fetch december month need to get the previous month 
				decemberDate = new Date(date.setMonth(monthNumber));
				month = decemberDate.getMonth()+1;
				year =  decemberDate.getFullYear();

			}
           	var result =app.autoReportGeneration(month,year,location);
			console.log('hey job is running...');
			console.log('month number ' +monthNumber+ 'month=' +month+ 'year=' +year);
			log.info('hey this first time from job sceduler');

		});

	}catch(error){
console.log("error has occured " +error)
	}
}
var methods = {
    schedule: timesheetJob,scheduleHandler
};
module.exports = methods;
