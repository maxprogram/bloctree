var path = require('path');
var _ = require('lodash');
var Q = require('q');
var csv = require('csv');
var fs = require('../fs');
var util = require('../util');

var config = require('../config').books;
var functions = require('./functions');
var record = require('./record');
var accountLib = require('./account');

var parse = Q.denodeify(csv.parse);
var map = util.mapPromise;

var Books = module.exports = function(dir, options) {
    if (!(this instanceof Books)) return new Books(dir, options);
    this.dir = dir;
    this.options = options;
    this.accounts = [];

    this.record = util.bindModule(record, this);
    this.account = util.bindModule(accountLib, this);
};

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

// Find an account
Books.prototype.find = function(q) {
    var s = (typeof q === 'number') ? {id: q} : {name: q};
    return _.where(this.accounts, s)[0];
};

// Gets user configuration
Books.prototype.getConfig = function() {
    var books = this;
    return fs.readJson(path.join(this.dir, 'books/config.json'))
    .then(function(config) {
        books.config = config;
        return config;
    });
};

/* Gets list of accounts + file paths
 * @returns {promise:array} List of accounts
 */
Books.prototype.getAccountList = function() {
    var books = this;
    return fs.glob('books/**/*' + config.extension, { cwd: books.dir })
    // Create account objects from files
    .then(map(parseAccount))
    .then(map(function(account) {
        account.file = path.join(books.dir, account.file);
        return account;
    }))
    .then(function(accounts) {
        books.accounts = accounts;
        return books.accounts;
    });
};

// Parses CSV Entries from an account object
Books.prototype._readEntries = function(account) {
    return fs.readFile(account.file).then(function(tsv) {
        return parse(tsv, {
            delimiter: config.delimiter,
            comment: config.comment
        });
    }).then(function(entries) {
        entries.shift();
        account.entries = _.reject(entries, function(e) {
            return e[0] === '';
        });
        return account;
    });
};

/* Gets full accounts with entries
 * @returns {promise:array} List of fully parsed accounts
 */
Books.prototype.getAccounts = function() {
    var books = this;
    return this.getAccountList()
    // Read entries from TSV files
    .then(map(this._readEntries));
};

/* Checks whether all debits/credits match
 * @param {array} accounts  Parsed accounts
 * @returns {boolean}
 */
Books.prototype.getBalance = function(accounts) {
    accounts = accounts || this.accounts;
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

    return +debits.toFixed(2) - credits.toFixed(2);
};

/* Gets full balance sheet will all accounts
 * @param {array} accounts  Parsed accounts
 * @returns {object} Grouped tree with all account totals
 */
Books.prototype.getBalanceSheet = function(accounts) {
    accounts = accounts || this.accounts;
    // Total each account
    return accounts.map(function(account) {
        var totals = functions.total(account.entries);
        var multiplier = (config.groups[account.group] || config.groups[account.type])[0];
        if (/expenses|cogs/.test(account.group)) multiplier *= -1;
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


