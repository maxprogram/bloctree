#!/usr/bin/env node

var _ = require('lodash');
var path = require('path');
var prog = require('commander');

var pkg = require('../package.json');
var books = require('../lib/books');

prog.version(pkg.version);

prog.command('balance [source_dir]')
.description('Builds balance sheet')
.action(function(dir, options) {
    dir = dir || process.cwd();
    dir = path.resolve(process.cwd(), dir);

    console.log('Building %s...', dir);

    books.balanceSheet(dir, options)
    .then(function(bs) {
        return JSON.stringify(bs, null, 2);
    })
    .then(console.log)
    .fail(console.error);
});

// Parse and fallback to help if no args
if(_.isEmpty(prog.parse(process.argv).args) && process.argv.length === 2) {
    prog.help();
}
