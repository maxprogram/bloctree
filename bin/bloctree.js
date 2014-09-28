#!/usr/bin/env node

var _ = require('lodash');
var Q = require('q');
var path = require('path');
var prog = require('commander');
var colors = require("colors");

var pkg = require('../package.json');
var log = require('./log');
var init = require('../lib/init');

prog.version(pkg.version);

require('./books');

var dir = process.cwd();

prog.command('new [name]')
.description('Records a transaction')
.option('-d, --description <>', 'Description of block')
.action(function(name, options) {
    if (!name) return log.error('Needs block name: bloctree new [name]');

    log.report('create', 'New block "%s"', name);
    init.newFromTemplate(name, dir)
    .then(function(folder) {
        log.report('done', path.relative(dir, folder).cyan + ' created');
    })
    .fail(log.error);
});


// Parse and fallback to help if no args
if(_.isEmpty(prog.parse(process.argv).args) && process.argv.length === 2) {
    prog.help();
}
