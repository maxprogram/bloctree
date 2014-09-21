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
    var fold = path.dirname(file).split(path.sep);
    var account = path.basename(file, config.extension);
    var name = account.split('-');
    fold.shift();
    return {
        id: parseFloat(name[0]),
        type: fold.shift(),
        group: fold.length ? fold.join('/') : null,
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

// Add convenience methods to accounts array
exports.addMethods = function(accounts) {
    accounts.find = function(q) {
        var s = (typeof q === 'number') ? {id: q} : {name: q};
        return _.where(this, s)[0];
    };
    return accounts;
};

exports.getConfig = function(dir) {
    return fs.readFile(path.join(dir, 'books/config.json'))
    .then(function(projConfig) {
        return JSON.parse(projConfig);
    });
};

exports.getAccountList = function(dir) {
    return fs.glob('books/**/*' + config.extension, { cwd: dir })
    // Create account objects from files
    .then(map(parseAccount))
    .then(map(function(account) {
        account.file = path.join(dir, account.file);
        return account;
    }))
    .then(this.addMethods);
};

exports.getAccounts = function(dir, options) {
    return this.getAccountList(dir)
    // Read entries from TSV files
    .then(map(readEntries))
    .then(this.addMethods);
};

// Gets full balance sheet will all accounts
exports.getBalanceSheet = function(dir, options) {
    var projConfig = {};
    // Get config & accounts
    return this.getConfig(dir).then(function(getConfig) {
        projConfig = getConfig;
        return exports.getAccounts(dir);
    })
    // Total each account
    .then(map(function(account) {
        account.total = functions.total(account.entries);
        return account;
    }))
    // Format final JSON
    .then(function(accounts) {
        return accounts.reduce(function(bs, a) {
            if (a.group) {
                if (!bs[a.type][a.group]) bs[a.type][a.group] = {};
                bs[a.type][a.group][a.name] = a.total;
            } else {
                bs[a.type][a.name] = a.total;
            }
            return bs;
        }, {
            assets: {},
            liabilities: {},
            equity: {}
        });
    });
};


