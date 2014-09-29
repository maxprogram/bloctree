var _ = require('lodash');
var colors = require('colors');
var accounting = require('accounting');

var config = require('../lib/config').bash;


colors.setTheme(config.colors);

module.exports = {
    printBalanceSheet: printBalanceSheet,
    Lines: Lines
};

function makeName(name) {
    if (config.capitalize) name = name.toUpperCase();
    name = name.replace(/_/g, ' ');
    return name + ' ';
}

function makeLine(c) {
    return new Array(config.width).join(c).split('');
}

// Lines object stores & manipulates lines
// (line = array of characters/strings)
function Lines() {
    this.lines = [];
}

Lines.prototype = {
    push: function(i) {
        this.lines.push(i);
        return this;
    },

    addSep: function(s) {
        this.push(makeLine(s));
        return this;
    },

    addAmount: function(name, amount, sep, color) {
        var line = makeLine(sep || '.');
        name = makeName(name);
        amount = ' ' + accounting.formatMoney(amount, {
            symbol: '',
            precision: 2,
            format: { pos: '%s %v ', neg: '%s(%v)', zero: '--  ' }
        });

        line.splice(0, name.length, name);
        line.splice(-amount.length + 1, amount.length, amount);

        // colors
        line[0] = line[0].account;
        line[line.length-1] = line[line.length-1][color || 'number'];

        this.push(line);
        return this;
    },

    addSumLine: function() {
        var len = 12;
        var sum = new Array(len).join('-');
        var line = makeLine(' ');
        line.splice(-len + 1, len, sum);

        this.push(line);
        return this;
    },

    print: function() {
        return this.lines.map(function(l) {
            return _.isString(l) ? l : l.join('');
        }).join('\n');
    }
};

// Prints a full formatted balance sheet from balance sheet
// object {assets, equity, liabilities} (see below)
function printBalanceSheet(bs) {
    var lines = new Lines();

    ['assets', 'liabilities', 'equity'].forEach(function(a) {
        var categorySum = 0;
        lines.push(makeName(a).bold).addSep('='.heading);

        listAccounts(bs[a]);
        function listAccounts(group, tab) {
            tab = tab || '';
            _.forEach(group, function(amt, acct) {
                if (!_.isPlainObject(amt)) {
                    categorySum += amt;
                    lines.addAmount(tab + acct, amt);
                } else {
                    lines.push(makeName(tab + acct).account);
                    listAccounts(amt, tab + '  ');
                }
            });
        }
        lines.addSumLine().addAmount('', categorySum, ' ', 'sum');
    });

    return lines.print();
}
/* Balance sheet format:
ASSETS
==========================================
CASH ........................... 10,000.00
INVENTORY ...................... 10,000.00
RECEIVABLES .................... 10,000.00
                              ------------
                                 30,000.00
LIABILITIES
==========================================
DEBT ............................ 8,000.00
                              ------------
                                  8,000.00
EQUITIES
==========================================
CONTRIBUTED CAPITAL ............ 12,000.00
REVENUE
  SALES ........................ 24,000.00
EXPENSES
  EXPENSES ..................... 14,000.00
                              ------------
                                 22,000.00
*/
