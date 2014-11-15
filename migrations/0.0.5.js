var Q = require('q');

var Books = require('../lib/books');
var util = require('../lib/util');

module.exports = function(blocPath) {
    var books = new Books(blocPath);
    var idMatch = {};

    return books.getAccounts().then(function() {
        // Replace IDs with hashes
        return books.record._replaceValue('id', function(prior, e, acct) {
            var newId = util.createUniqueId();
            idMatch[acct.id+'-'+prior] = acct.id+'-'+newId;
            return newId;
        });
    }).then(function() {
        // Replace reference IDs
        return books.record._replaceValue('reference', function(prior) {
            if (idMatch[prior]) prior = idMatch[prior];
            return prior;
        });
    }).thenResolve(true);
};
