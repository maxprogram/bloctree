var expect = require('chai').expect;
var _ = require('lodash');

var books = require('../lib/books');

var BLOCKS = {
    a: __dirname + '/block-a'
};

describe('Books', function() {

describe('#getAccountList', function() {
    it('should output accounts list', function(done) {
        books.getAccountList(BLOCKS.a)
        .then(function(accounts) {
            var cash  = accounts.find('cash');
            var sales = accounts.find('sales');
            expect(sales.type).to.equal('equity');
            expect(sales.group).to.equal('revenue');
            expect(cash.group).to.be.null;
        }).then(done, done);
    });
});

describe('#getAccounts', function() {
    it('should read account entries', function(done) {
        books.getAccounts(BLOCKS.a)
        .then(function(accounts) {
            var cash = accounts.find(100);
            expect(cash.entries).to.be.an('array');
            expect(cash.entries[0][2]).to.equal('200.00');
        }).then(done, done);
    });
});

describe('#getCheck', function() {
    it('should return true if books balance', function(done) {
        books.getCheck(BLOCKS.a)
        .then(function(balanced) {
            expect(balanced).to.be.true;
        }).then(done, done);
    });

    it('should return false if books don\'t balance', function(done) {
        books.getAccounts(BLOCKS.a)
        .then(function(accounts) {
            accounts[0].entries[0][2] += 1;
            expect(books.checkAccounts(accounts)).to.be.false;
        }).then(done, done);
    });
});

describe('#getBalanceSheet', function() {
    it('should output full balance sheet', function(done) {
        books.getBalanceSheet(BLOCKS.a)
        .then(function(bs) {
            expect(bs.assets.cash).to.equal(352.33);
            expect(bs.equity.contributed_capital).to.equal(200);
        }).then(done, done);
    });
});

});
