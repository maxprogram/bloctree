var expect = require('chai').expect;
var Q = require('q');
var _ = require('lodash');
var fs = require('../lib/fs');
var path = require('path');

var Books = require('../lib/books');
var migrate = require('../lib/migrate');

var BLOCKS = {
    old: './block-old',
    test: './test-block'
};

var oldTest = join(BLOCKS.test);
var books = new Books(oldTest);

function join(p) { return path.join(__dirname, p); }
before(function(done) {
    fs.copy(join(BLOCKS.old), oldTest).then(done, done);
});

after(function(done) {
    fs.remove(oldTest).then(done, done)
});

describe('migrate', function() {

it('should migrate to new version', function(done) {
    migrate.runMigrations(oldTest, '0.0.5').then(function(migs) {
        expect(migs[0].migrated).to.be.true;
        var bloc = require(path.join(oldTest, 'bloc.json'));
        expect(bloc).to.have.property('bloctree','0.0.5');

        return books.getAccounts();
    }).then(function() {
        var entry = books.accounts[0].entries[0];
        var id = entry[books.record._getIdx('id')];
        var ref = entry[books.record._getIdx('reference')];
        expect(id).to.have.length.above(3);
        expect(ref).to.have.length.above(7);
    })
    .then(done, done);
});

});
