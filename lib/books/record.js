var path = require('path');
var _ = require('lodash');
var Q = require('q');
var csv = require('csv');
var fs = require('../fs');
var util = require('../util');

var config = require('../config').books;

var stringify = Q.denodeify(csv.stringify);
var map = util.mapPromise;
var ACCOUNT = config.account;


var getIdx = exports._getIdx = function getIdx(key) {
    return _.keys(ACCOUNT).indexOf(key);
};

function getVal(entry, key) {
    return entry[getIdx(key)];
}

function accountToArray(account) {
    return _.reduce(ACCOUNT, function(arr, v, k) {
        arr.push(account[k]);
        return arr;
    }, []);
}

// Add info to a new or existing entry
function addEntryDetails(details, entry) {
    entry = entry || [];

    var defaults = {};
    _.keys(ACCOUNT).forEach(function(key, i) {
        defaults[key] = entry[i] || ACCOUNT[key];
    });
    if (details.datetime)
        details.datetime = new Date(details.datetime).toISOString();

    details = _.defaults(details, defaults);

    return accountToArray(details);
}

function generateId(entries) {
    var ids = entries.map(function(e) {
        return e[0];
    });
    return util.createUniqueId(ids);
}

function entryIdxById(entries, id) {
    var matches = _.where(entries, function(e) {
        return new RegExp('^' + id).test(e[0]);
    });
    if (matches.length != 1) return -1;
    return _.findIndex(entries, function(e) {
        return e[0] === matches[0][0];
    });
}

// Writes entries to a TSV file with headers
function writeTsv(file, entries) {
    entries = [_.keys(ACCOUNT)].concat(entries);

    return stringify(entries, { delimiter: config.delimiter })
    .then(function(string) {
        return fs.writeFile(file, string);
    });
}

/* Records entry to single account
 * @param {(string|number)} account Account name or ID
 * @param {object} details Entry details
 * @returns {promise:array} New entry
 */
exports.entry = function(account, details) {
    account = this.find(account);
    if (!account) return Q.reject(new Error('Account not found'));

    details.id = generateId(account.entries);
    var entry = addEntryDetails(details);
    account.entries.push(entry);

    return writeTsv(account.file, account.entries)
    .thenResolve(entry);
};

/* Removes an entry
 * @param {(string|number)} account Account name or ID
 * @param {number} id Entry ID
 * @returns {promise}
 */
exports.remove = function(account, id) {
    account = this.find(account);

    var idx = entryIdxById(account.entries, id);
    if (idx >= 0) account.entries.splice(idx, 1);

    return writeTsv(account.file, account.entries);
};

/* Edits an entry
 * @param {(string|number)} account Account name or ID
 * @param {number} entry Entry ID
 * @param {number} details Entry details
 * @returns {promise:array} New entry
 */
exports.update = function(account, entryId, details) {
    account = this.find(account);
    var entry = account.entries[entryIdxById(account.entries, entryId)];
    if (!entry) return Q.reject(new Error('Entry '+entryId+' not found'));

    if (details.id) delete details.id;
    var idx = account.entries.indexOf(entry);
    entry = addEntryDetails(details, entry);
    account.entries.splice(idx, 1, entry);

    return writeTsv(account.file, account.entries)
    .thenResolve(entry);
};

/* Records a transaction (2 matching entries)
 * @param {(string|number)} drAccount Account name or ID
 * @param {(string|number)} crAccount Account name or ID
 * @param {number} details Entry details
 * @returns {promise:array} Final entries
 */
exports.transaction = function(drAcct, crAcct, details) {
    var drAccount = this.find(drAcct);
    var crAccount = this.find(crAcct);
    if (!drAccount) return Q.reject(new Error('Debit account "'+drAcct+'" not found'));
    if (!crAccount) return Q.reject(new Error('Credit account "'+crAcct+'" not found'));

    var books = this;
    var amount = details.credit || details.debit;
    details.credit = details.debit = 0;
    var drEntry = details;
    var crEntry = _.clone(details);
    drEntry.debit = crEntry.credit = amount;

    // Record entries
    return Q.all([
        books.record.entry(drAccount.id, drEntry),
        books.record.entry(crAccount.id, crEntry)
    ])
    // Update entry references
    .then(function(entries) {
        var drId = getVal(entries[0], 'id');
        var crId = getVal(entries[1], 'id');
        var dr = { reference: drAccount.id + '-' + drId };
        var cr = { reference: crAccount.id + '-' + crId };

        return Q.all([
            books.record.update(drAccount.id, drId, cr),
            books.record.update(crAccount.id, crId, dr)
        ]);
    });
};

/** Utility for replacing a value in every entry
 ** ! SAVE A BACKUP OF BOOKS BEFORE RUNNING !
 * @param {string} column Column name
 * @param {(string|function)} replace
 */
exports._replaceValue = function(column, replace) {
    column = getIdx(column);
    return util.promiseSeries(this.accounts, function(acct) {
        acct.entries = acct.entries.map(function(e) {
            var val = e[column];
            if (_.isFunction(replace)) e[column] = replace(val, e, acct);
            if (_.isString(replace)) e[column] = replace;
            return e;
        });

        return writeTsv(acct.file, acct.entries);
    }).thenResolve('done');
};
