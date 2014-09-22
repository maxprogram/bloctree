var path = require('path');
var _ = require('lodash');
var Q = require('q');
var csv = require('csv');
var fs = require('../fs');
var util = require('../util');

var config = require('../config').books;

var stringify = Q.denodeify(csv.stringify);
var map = util.mapPromise;

var ACCOUNT = {
    id:          0,
    datetime:    new Date().toISOString(),
    debit:       0,
    credit:      0,
    reference:   '',
    description: ''
};

function addEntryDetails(details, entry) {
    entry = entry || [];
    details = _.defaults(details, {
        id:          entry[0] || 0,
        datetime:    entry[1] || new Date().toISOString(),
        debit:       entry[2] || 0,
        credit:      entry[3] || 0,
        reference:   entry[4] || '',
        description: entry[5] || ''
    });
    return [
        details.id,
        details.datetime,
        details.debit,
        details.credit,
        details.reference,
        details.description
    ];
}

function getLastId(entries) {
    return parseFloat(entries[entries.length - 1][0]);
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

    return stringify(account.entries, { delimiter: config.delimiter })
    // Append to account file
    .then(function(string) {
        return fs.appendFile(account.file, string);
    }).then(function() {
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
    account.entries.splice(0, 0, _.keys(ACCOUNT));

    return stringify(account.entries, { delimiter: config.delimiter })
    .then(function(string) {
        return fs.writeFile(account.file, string);
    });
};
