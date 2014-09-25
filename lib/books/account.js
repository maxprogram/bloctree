var path = require('path');
var _ = require('lodash');
var Q = require('q');
var csv = require('csv');
var fs = require('../fs');
var util = require('../util');

var config = require('../config').books;

var stringify = Q.denodeify(csv.stringify);
var ACCOUNT = config.account;


// Creates data file with headers
function writeAccount(file) {
    var rows = [_.keys(ACCOUNT)];

    return fs.mkdirp(path.dirname(file)).then(function() {
        return stringify(rows, { delimiter: config.delimiter });
    }).then(function(string) {
        return fs.writeFile(file, string);
    });
}

function parseAccount(account, category) {
    account = account.toLowerCase().trim()
        .replace(/[\/\\'"@#^!*:;<>?]/g, '')
        .replace(/\s/g, '_');
    category = category.toLowerCase().trim()
        .replace(/['"@#^!*:;<>?]/g, '')
        .replace(/\s|-/g, '_')
        .split(/\/|:/);

    var acct = {
        name: account
    };

    function categorize(names, type, group) {
        if (_.contains(names, category[0])) {
            acct.type = type;
            category[0] = group;
            acct.group = category.join('/');
        }
    }

    categorize(['revenues','sales','revenue'], 'equity', 'revenue');
    categorize(['expenses','expense'], 'equity', 'expenses');
    categorize(['cogs','cost_of_goods','cost_of_goods_sold'], 'equity', 'cogs');
    categorize(['assets','asset'], 'assets', '');
    categorize(['equity','owners_equity'], 'equity', '');
    categorize(['liability','liabilities'], 'liabilities', '');

    return acct;
}

/* Adds an account
 * @param {string} account Account name
 * @param {string} category Category string ('assets/property/appliances')
 * @returns {promise:object} New account
 */
exports.add = function(account, category) {
    if (!account || !category)
        return Q.reject(new Error('Need account name & category'));

    var accounts = this.accounts;
    account = parseAccount(account, category);

    // Get the last account id for the category
    var startNum = (config.groups[account.group] || config.groups[account.type])[1];
    var highestNum = _(accounts).where(function(a) {
        return startNum == (Math.floor(a.id/100)*100);
    }).pluck('id').max().value();
    var subNum = highestNum - startNum;
    if (subNum == 99) return Q.reject(new Error('Category is full'));

    // Build file path
    account.id = highestNum + 1;
    var escGroup = account.group.replace(/\//g, path.sep);
    var file = account.id + '-' + account.name + config.extension;
    account.file = path.join(this.dir, 'books', account.type, escGroup, file);

    return writeAccount(account.file).thenResolve(account);
};
