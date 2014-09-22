var expect = require('chai').expect;
var _ = require('lodash');

var books = require('../lib/books');

var BLOCKS = {
    a: __dirname + '/block-a'
};

var accts;

describe('', function() {

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
            accts = accounts;
            var cash = accounts.find(100);
            expect(cash.entries).to.be.an('array');
            expect(cash.entries[0][2]).to.equal('200');
        }).then(done, done);
    });
});

describe('#isBalanced', function() {
    it('should return true if books balance', function() {
        var isBalanced = books.isBalanced(accts);
        expect(isBalanced).to.be.true;
    });

    it('should return false if books don\'t balance', function() {
        var bad = _.cloneDeep(accts);
        bad[0].entries[0][2] += 1;
        var isBalanced = books.isBalanced(bad);
        expect(isBalanced).to.be.false;
    });
});

describe('#getBalanceSheet', function() {
    it('should output full balance sheet', function() {
        var bs = books.getBalanceSheet(accts);
        expect(bs.assets.cash).to.equal(352.33);
        expect(bs.equity.contributed_capital).to.equal(200);
    });
});

});

describe('#record', function() {

describe('#entry()', function() {
    it('should add entry to account', function(done) {
        books.record.entry(accts, "cash", {
            debit: 88,
            description: 'test'
        }).then(function(entry) {
            expect(entry[2]).to.equal(88);
            expect(entry[5]).to.equal('test');
        }).then(done, done);
    });
});

});
