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


function getIdx(key) {
    return _.keys(ACCOUNT).indexOf(key);
}

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
    details = _.defaults(details, defaults);

    return accountToArray(details);
}

function getLastId(entries) {
    return parseFloat(entries[entries.length - 1][0]);
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

    details.id = getLastId(account.entries) + 1;
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

    var idx = _.findIndex(account.entries, function(e) {
        return e[0] == id;
    });
    account.entries.splice(idx, 1);

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
    var entry = _.where(account.entries, function(e) {
        return getVal(e,'id') == entryId;
    })[0];
    if (!entry) return Q.reject(new Error('Entry %n not found',entryId));

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
exports.transaction = function(drAccount, crAccount, details) {
    drAccount = this.find(drAccount);
    crAccount = this.find(crAccount);

    var books = this;
    var amount = details.credit || details.debit;
    details.credit = details.debit = 0;
    var drEntry = details;
    var crEntry = _.clone(details);
    drEntry.debit = crEntry.credit = amount;

    return Q.all([
        books.record.entry(drAccount.id, drEntry),
        books.record.entry(crAccount.id, crEntry)
    ]).then(function(entries) {
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
