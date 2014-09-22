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
 * @param {array} accounts  Parsed accounts
 * @param {(string|number)} account Account name or ID
 * @param {object} details Entry details
 * @returns {promise:array} New entry
 */
exports.entry = function(account, details) {
    account = this.find(account);

    var lastId = getLastId(account.entries);
    details.id = lastId + 1;
    var entry = addEntryDetails(details);
    account.entries.push(entry);

    return writeTsv(account.file, account.entries)
    .then(function() {
        return entry;
    });
};

/* Removes an entry
 * @param {array} accounts  Parsed accounts
 * @param {(string|number)} account Account name or ID
 * @param {number} id Entry ID
 * @returns {promise:array} Accounts
 */
exports.remove = function(account, id) {
    account = this.find(account);

    var index = _.findIndex(account.entries, function(e) {
        return e[0] == id;
    });
    account.entries.splice(index, 1);

    return writeTsv(account.file, account.entries);
};
