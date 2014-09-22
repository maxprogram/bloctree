var expect = require('chai').expect;
var _ = require('lodash');

var Books = require('../lib/books');

var BOOKS = {
    a: new Books(__dirname + '/block-a')
};

var accts, id;

describe('', function() {

var books = BOOKS.a;

describe('#getAccountList', function() {
    it('should output accounts list', function(done) {
        books.getAccountList()
        .then(function(accounts) {
            var cash  = books.find('cash');
            var sales = books.find('sales');
            expect(sales.type).to.equal('equity');
            expect(sales.group).to.equal('revenue');
            expect(cash.group).to.be.null;
        }).then(done, done);
    });
});

describe('#getAccounts', function() {
    it('should read account entries', function(done) {
        books.getAccounts()
        .then(function(accounts) {
            var cash = books.find(100);
            expect(cash.entries).to.be.an('array');
            expect(cash.entries[0][2]).to.equal('200');
        }).then(done, done);
    });
});

describe('#isBalanced', function() {
    it('should return true if books balance', function() {
        var isBalanced = books.isBalanced();
        expect(isBalanced).to.be.true;
    });

    it('should return false if books don\'t balance', function() {
        var bad = _.cloneDeep(books.accounts);
        bad[0].entries[0][2] += 1;
        var isBalanced = books.isBalanced(bad);
        expect(isBalanced).to.be.false;
    });
});

describe('#getBalanceSheet', function() {
    it('should output full balance sheet', function() {
        var bs = books.getBalanceSheet();
        expect(bs.assets.cash).to.equal(352.33);
        expect(bs.equity.contributed_capital).to.equal(200);
    });
});

});

describe('#record', function() {

var books = BOOKS.a;

describe('#entry()', function() {
    it('should add entry to account', function(done) {
        books.record.entry("cash", {
            debit: 88,
            description: 'test'
        }).then(function(entry) {
            id = entry[0];
            expect(entry[2]).to.equal(88);
            expect(entry[5]).to.equal('test');
        }).then(done, done);
    });
});

describe('#remove()', function() {
    it('should remove entry from account', function(done) {
        books.record.remove("cash", id)
        .then(function() {
            return books.getAccounts();
        })
        .then(function() {
            var cash  = books.find('cash');
            var lastEntry = cash.entries[cash.entries.length-1];
            expect(lastEntry[2]).to.not.equal(88);
        }).then(done, done);
    });
});

});
