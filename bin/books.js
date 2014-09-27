#!/usr/bin/env node

var _ = require('lodash');
var Q = require('q');
var path = require('path');
var prog = require('commander');
var colors = require("colors");

var pkg = require('../package.json');
var util = require('../lib/util');
var Books = require('../lib/books');

var log = require('./log');
var layout = require('./layout');


prog.version(pkg.version);

var dir = process.cwd(), bloc, books;

try {
    bloc = require(path.join(dir, 'bloc.json'));
} catch(err) {
    console.error('Not a valid bloctree project');
}

prog.command('record [name] [amount]')
.description('Records a transaction')
.option('-m, --message <description>', 'Description of transaction')
.action(function(name, amount, options) {
    if (!name) return log.error('Need transaction name');
    if (!amount) return log.error('Need transaction amount');

    log.report('record', '%s...', name);
    books = new Books(dir, options);
    books.getAccounts()
    .then(function() {
        return books.getConfig();
    }).then(function(config) {
        var transaction = config.transactions[name];
        if (!transaction) return Q.reject('Transaction name not found');

        return books.record.transaction(transaction.debit, transaction.credit, {
            debit: amount,
            description: options.message
        });
    })
    .then(function(entries) {
        log.report('done', parseFloat(amount).toFixed(2) + ' ' + name + ' recorded');
    })
    .fail(log.error);
});

prog.command('new:account [name] [category]')
.description('Create a new account')
.action(function(name, category, options) {
    if (!name) return log.error('Need account name');
    if (!category) return log.error('Need category name or path');

    log.report('create', 'account "%s"...', name);
    books = new Books(dir, options);
    books.getAccountList()
    .then(function() {
        return books.account.add(name, category);
    })
    .then(function(account) {
        log.report('done', 'created at: '+ path.relative(dir, account.file).cyan);
    })
    .fail(log.error);
});

prog.command('get:balance')
.description('Builds balance sheet')
.action(function(options) {
    log.report('get', '%s balance sheet...', bloc.name);

    books = new Books(dir, options);
    books.getAccounts()
    .then(books.getBalanceSheet)
    .then(function(bs) {
        return layout.printBalanceSheet(bs);
    })
    .then(console.log)
    .fail(log.error);
});

// Parse and fallback to help if no args
if(_.isEmpty(prog.parse(process.argv).args) && process.argv.length === 2) {
    prog.help();
}
