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

exports.record = require('./record');

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

// Gets user configuration
exports.getConfig = function(dir) {
    return fs.readFile(path.join(dir, 'books/config.json'))
    .then(function(projConfig) {
        return JSON.parse(projConfig);
    });
};

/* Gets list of accounts + file paths
 * @param {string} dir  Project directory
 * @returns {promise:array} List of accounts
 */
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

/* Gets full accounts with entries
 * @param {string} dir  Project directory
 * @returns {promise:array} List of fully parsed accounts
 */
exports.getAccounts = function(dir) {
    return this.getAccountList(dir)
    // Read entries from TSV files
    .then(map(readEntries))
    .then(this.addMethods);
};

/* Checks whether all debits/credits match
 * @param {array} accounts  Parsed accounts
 * @returns {boolean}
 */
exports.isBalanced = function (accounts) {
    // Sum individual debit/credits
    accounts = accounts.map(function(account) {
        account.totals = functions.total(account.entries);
        return account;
    });
    // Compare final totals
    var debits = accounts.reduce(function(sum, a) {
        return sum + a.totals[0];
    }, 0);
    var credits = accounts.reduce(function(sum, a) {
        return sum + a.totals[1];
    }, 0);

    return (debits == credits);
};

/* Gets full balance sheet will all accounts
 * @param {array} accounts  Parsed accounts
 * @returns {object} Grouped tree with all account totals
 */
exports.getBalanceSheet = function(accounts) {
    // Total each account
    return accounts.map(function(account) {
        var totals = functions.total(account.entries);
        var multiplier = config.groups[account.group] || config.groups[account.type];
        account.total = (totals[0] - totals[1]) * multiplier;
        return account;
    })
    // Format final JSON
    .reduce(function(bs, a) {
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
};


