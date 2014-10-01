#!/usr/bin/env node

var _ = require('lodash');
var Q = require('q');
var path = require('path');
var prog = require('commander');
var colors = require("colors");

var util = require('../lib/util');
var Books = require('../lib/books');

var log = require('./log');
var layout = require('./layout');


var dir = process.cwd(), bloc, books;

function getBlocConfig() {
    if (bloc) return true;
    try {
        bloc = require(path.join(dir, 'bloc.json'));
        return true;
    } catch(err) {
        log.error('Not a valid bloctree project (needs bloc.json)');
        return false;
    }
}

prog.command('ls:accounts')
.description('Lists book accounts')
.action(function() {
    books = new Books(dir);

    function space(txt, len) {
        return txt + new Array(len - txt.length).join(' ');
    }

    books.getAccountList()
    .then(function() {
        books.accounts.forEach(function(a) {
            console.log([
                space(a.type, 12).cyan,
                a.id.toString().green,
                a.group ? a.group.grey : null,
                a.name
            ].join(' '));
        });
    });
});

prog.command('record [name] [amount]')
.description('Records a transaction')
.option('-m, --message <description>', 'Description of transaction')
.action(function(name, amount, options) {
    if (!getBlocConfig()) return false;
    if (!name) return log.error('Need transaction name');
    if (!amount) return log.error('Need transaction amount');

    log.report('record', '%s...', name);
    books = new Books(dir, options);
    books.getAccounts()
    .then(function() {
        return books.getConfig();
    }).then(function(config) {
        var transaction = _.where(config.transactions, function(t) {
            return _.contains(t.name, name.trim().toLowerCase());
        })[0];
        if (!transaction) return Q.reject('Transaction name not found');

        return books.record.transaction(transaction.debit, transaction.credit, {
            debit: amount,
            description: options.message || transaction.description
        });
    })
    .then(function(entries) {
        log.report('done', parseFloat(amount).toFixed(2) + ' ' + name + ' recorded');
    })
    .fail(log.error);
});

prog.command('new:entry [name]')
.description('Records a single entry')
.option('-d, --debit <amount>', 'Debit')
.option('-c, --credit <amount>', 'Credit')
.option('-m, --message <description>', 'Description of transaction')
.action(function(name, options) {
    if (!getBlocConfig()) return false;
    if (!name) return log.error('Need account name');
    if (!options.debit && !options.credit) return log.error('Need entry amount');

    log.report('record', '%s...', name);
    books = new Books(dir, options);
    books.getAccounts()
    .then(function(config) {
        return books.record.entry(name, {
            debit: options.debit || 0,
            credit: options.credit || 0,
            description: options.message
        });
    })
    .then(function(entries) {
        var amt = parseFloat(options.debit || options.credit).toFixed(2);
        log.report('done', amt + ' in ' + name + ' recorded');
    })
    .fail(log.error);
});

prog.command('new:account [name] [category]')
.description('Create a new account')
.action(function(name, category, options) {
    if (!getBlocConfig()) return false;
    if (!name) return log.error('Need account name');
    if (!category) return log.error('Need category name or path');

    log.report('create', 'account "%s"...', name);
    books = new Books(dir, options);
    books.getAccountList()
    .then(function() {
        return books.account.add(name, category);
    })
    .then(function(account) {
        log.report('done', path.relative(dir, account.file).cyan + ' created');
    })
    .fail(log.error);
});

prog.command('get:balance')
.description('Builds balance sheet')
.action(function(options) {
    if (!getBlocConfig()) return false;
    log.report('get', '%s balance sheet...', bloc.name);

    books = new Books(dir, options);
    books.getAccounts()
    .then(function() {
        if (!books.isBalanced()) log.error('Accounts are unbalanced!');
    })
    .then(function() {
        return books.getBalanceSheet();
    })
    .then(function(bs) {
        return layout.printBalanceSheet(bs);
    })
    .then(console.log)
    .fail(log.error);
});
