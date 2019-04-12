"use strict";
var nodemailer = require('nodemailer');
var fs = require('fs');
var getConfig = require('./common/config');

function sendMail(to, cc, bcc, subject, action, model) {
	var templateName = null;
	if(action == 'register'){
		templateName = 'tRegister.html';
	} else if(action == 'reminder'){
		templateName = 'tReminder.html';
	}else if(action == 'passwordEmail'){
		templateName = 'passwordEmail.html';
	}
	var template = fs.readFileSync('./app/'+templateName,{encoding:'utf-8'});
	for (var key in model) {
		template = template.replace(new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), model[key]);
	}
	var config = getConfig();
    var mailHost = config.mail.host;
    var transporter = nodemailer.createTransport(mailHost);
    var mailOptions = {
        from: config.mail.fromAddress,
        to: to,
		cc: cc,
        bcc: bcc,
        subject: subject,
        html: template
    };
    console.log('Sending mail to ' + to + ', subject is - ' + subject);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error)
            return console.log(error);
    });
}
function sendMailWithAttachment(fromAddress,to, cc, bcc, subject, action, model, reportName) {
	var templateName = null;
	console.log('template define :' +action)
	if(action == 'register'){
		templateName = 'tRegister.html';
	} else if(action == 'reminder'){
		templateName = 'tReminder.html';
	}else if(action == 'timesheetReport'){
		templateName = 'timesheetReport.html';
	}else if(action == 'TSCBackendUpdt'){
		templateName = 'TSCBackendUpdt.html'
	}else{
		return;
	}
	var template = fs.readFileSync('./app/'+templateName,{encoding:'utf-8'});
	for (var key in model) {
		template = template.replace(new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), model[key]);
	}
	var config = getConfig();
    var mailHost = config.mail.host;
    var transporter = nodemailer.createTransport(mailHost);
    var mailOptions = {
        from: fromAddress,
        to: to,
		cc: cc,
        bcc: bcc,
        subject: subject,
        html: template,
		attachments: [
			{
				path: 'reports/'+reportName+'.xlsx'
			}
		]
    };
    console.log('Sending mail to ' + to + ', subject is - ' + subject);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error)
            return console.log(error);
    });
}
function email(to, cc, bcc, subject, action, model,content) {
	var templateName = null;
	var templateContent = null;
	console.log('templateName='+action);
	if(action == 'register'){
		templateName = 'tRegister.html';
	} else if(action == 'reminder'){
		templateName = 'tReminder.html';
	}else if(action == 'incompleteTimesheet'){
		templateName ='incompleteTimesheetReminder.html'
	}
	else{
      templateContent =content;
	}
	if(templateName !=null){
		var template = fs.readFileSync('./app/'+templateName,{encoding:'utf-8'});
	for (var key in model) {
		template = template.replace(new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), model[key]);
	}
	templateContent =template
	}
	var config = getConfig();
    var mailHost = config.mail.host;
    var transporter = nodemailer.createTransport(mailHost);
    var mailOptions = {
        from: config.mail.fromAddress,
        to: to,
		cc: cc,
        bcc: bcc,
        subject: subject,
        html: templateContent
    };
    console.log('Sending mail to ' + to + ', subject is - ' + subject);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error){
            return console.log(error);
        }
    });
}
var emailer = {
    sendMail: sendMail,
	sendMailWithAttachment: sendMailWithAttachment,
    email : email
};
module.exports = emailer;
