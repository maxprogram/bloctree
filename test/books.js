var expect = require('chai').expect;
var Q = require('q');
var _ = require('lodash');
var fs = require('../lib/fs');
var path = require('path');

var Books = require('../lib/books');

var BOOKS = {
    a: './block-a',
    test: './test-block'
};

var id, books;

function join(p) { return path.join(__dirname, p); }
before(function(done) {
    fs.copy(join(BOOKS.a), join(BOOKS.test))
    .then(function() {
        books = new Books(join(BOOKS.test));
    }).then(done, done);
});

after(function(done) {
    fs.remove(join(BOOKS.test))
    .then(done, done)
});


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

describe('#getBalance', function() {
    it('should return 0 if books balance', function() {
        var blnc = books.getBalance();
        expect(blnc).to.equal(0);
    });

    it('should return false if books don\'t balance', function() {
        var bad = _.cloneDeep(books.accounts);
        bad[0].entries[0][2] = parseFloat(bad[0].entries[0][2]) + 1;
        var blnc = books.getBalance(bad);
        expect(blnc).to.equal(1);
    });
});

describe('#getBalanceSheet', function() {
    it('should output full balance sheet', function() {
        var bs = books.getBalanceSheet();
        expect(bs.assets.cash).to.be.above(300);
        expect(bs.equity.contributed_capital).to.equal(200);
    });
});


describe('#record', function() {

describe('#entry()', function() {
    it('should add entry to account', function(done) {
        books.record.entry("cash", {
            debit: 88,
            description: 'test',
            datetime: '2014-9-14'
        }).then(function(entry) {
            id = entry[books.record._getIdx('id')];
            date = new Date(entry[books.record._getIdx('datetime')]);
            debit = entry[books.record._getIdx('debit')];
            desc = entry[books.record._getIdx('description')];
            expect(date.getFullYear()).to.equal(2014);
            expect(debit).to.equal(88);
            expect(desc).to.equal('test');
        }).then(done, done);
    });
});

describe('#update()', function() {
    it('should edit entry', function(done) {
        books.record.update("cash", id, {
            debit: 33,
        }).then(function(entry) {
            expect(entry[2]).to.equal(33);
            return books.getAccounts();
        }).then(function() {
            var cash  = books.find('cash');
            var lastEntry = cash.entries[cash.entries.length-1];
            expect(parseFloat(lastEntry[2])).to.equal(33);
        }).then(done, done);
    });
});

describe('#remove()', function() {
    it('should remove entry from account', function(done) {
        books.record.remove("cash", id)
        .then(function() {
            return books.getAccounts();
        }).then(function() {
            var cash  = books.find('cash');
            var lastEntry = cash.entries[cash.entries.length-1];
            expect(parseFloat(lastEntry[2])).to.not.equal(33);
        }).then(done, done);
    });
});

describe('#transaction()', function() {
    it('should add transaction to account', function(done) {
        var id;
        books.record.transaction("cash", 400, {
            debit: 45.62,
            description: 'transaction test'
        }).then(function(t) {
            expect(t[0][2]).to.equal(45.62);
            expect(t[1][3]).to.equal(45.62);
            expect(t[0][4].split('-')[1]).to.equal(t[1][0]+'');
            return Q.all([
                books.record.remove("cash",t[0][0]),
                books.record.remove(400,t[1][0])
            ]).then(function() {});
        }).then(done, done);
    });
});

});

describe('#account', function() {

describe('#add()', function() {
    it('should add a new account', function(done) {
        books.account.add('Consulting','revenues')
        .then(function(account) {
            expect(account.name).to.eql('consulting');
            expect(account.type).to.eql('equity');
            expect(account.group).to.eql('revenue');
            expect(account.id).to.eql(401);
            return fs.remove(account.file);
        }).then(done, done);
    });
});

});
