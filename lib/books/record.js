var path = require('path');
var _ = require('lodash');
var Q = require('q');
var csv = require('csv');
var fs = require('../fs');
var util = require('../util');

var config = require('../config').books;

var stringify = Q.denodeify(csv.stringify);
var map = util.mapPromise;


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
console.log(this)
    account = this.find(account);

    var lastId = getLastId(account.entries);
    details.id = lastId + 1;
    var entry = addEntryDetails(details);
    account.entries.push(entry);

    return stringify([entry], { delimiter: config.delimiter })
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
 * @param {object} details Entry details
 * @returns {promise:array} New entry
 */


