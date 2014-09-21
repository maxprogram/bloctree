var expect = require('chai').expect;

var books = require('../lib/books');

var BLOCKS = {
    a: __dirname + '/block-a'
};

describe('Books', function() {

describe('#balanceSheet', function() {
    it('should output full balance sheet', function(done) {
        books.balanceSheet(BLOCKS.a)
        .then(function(bs) {
            expect(bs.assets.cash).to.equal(300);
            expect(bs.equity.contributed_capital).to.equal(200);
        }).then(done, done);
    });
});

});
