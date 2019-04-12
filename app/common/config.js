"use strict";
var fs = require('fs');
var yaml = require('js-yaml');
var path = require('path');
var configs = {};
function getConfig(environment) {
    environment = environment || 'dev';
    if (!configs[environment]) {
        var config = yaml.safeLoad(fs.readFileSync(path.resolve('config.' + environment + '.yml'), { encoding: 'utf8' }).replace(/^\uFEFF/, ''));
        configs[environment] = config;
        var appSettings = configs[environment].app;
        if (appSettings.urlPrefix)
            appSettings.urlPrefix = appSettings.urlPrefix.replace(/^\/?(.*[^/])\/?$/g, '/$1');
        if (appSettings.baseUrl)
            appSettings.baseUrl = appSettings.baseUrl.replace(/^\/?(.*[^/])\/?$/g, '/$1');
        appSettings.version = '0.0.0';
        if (fs.existsSync(path.resolve('VERSION'))) {
            appSettings.version = fs.readFileSync(path.resolve('VERSION'), { encoding: 'utf8' }).trim();
        }
        console.log('version is ' + appSettings.version);
    }
    return configs[environment];
}
module.exports = getConfig;
