var path = require('path');
var _ = require('lodash');
var Q = require('q');
var csv = require('csv');
var fs = require('../fs');
var util = require('../util');

var config = require('../config').books;
var functions = require('./functions');

var parse = Q.denodeify(csv.parse);
var map = util.mapPromise;

// Creates an account object from file path
function parseAccount(file) {
    var fold = file.split(path.sep);
    var account = path.basename(fold[2], config.extension);
    var name = account.split('-');
    return {
        id: parseFloat(name[0]),
        type: fold[1],
        name: name[1],
        file: file
    };
}

// Parses CSV Entries from an account object
// (turns account.file >> account.entries)
function readEntries(account) {
    return fs.readFile(account.file).then(function(tsv) {
        return parse(tsv, {
            delimiter: config.delimiter,
            comment: config.comment
        });
    }).then(function(entries) {
        entries.shift();
        account.entries = entries;
        delete account.file;
        return account;
    });
}

exports.balanceSheet = function(dir, options) {
    var projConfig = {};

    return fs.readFile(path.join(dir, 'books/config.json'))
    .then(function(projConfig) {
        projConfig = JSON.parse(projConfig);
        return fs.glob('books/**/*' + config.extension, { cwd: dir });
    })
    // Create account objects from files
    .then(function(files) {
        return files
        .map(parseAccount)
        .map(function(account) {
            account.file = path.join(dir, account.file);
            return account;
        });
    })
    // Read entries from TSV files
    .then(map(readEntries))
    // Total each account
    .then(map(function(account) {
        account.total = functions.total(account.entries);
        return account;
    }))
    // Format final JSON
    .then(function(accounts) {
        var bs = {
            assets: {},
            liabilities: {},
            equity: {}
        };
        accounts.forEach(function(account) {
            bs[account.type][account.name] = account.total;
        });
        return bs;
    });
};


