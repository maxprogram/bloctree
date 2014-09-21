var _ = require('lodash');
var Q = require('q');


exports.mapPromise = function(func) {
    return function(array) {
        array = array.map(function(n) {
            return Q.promised(func)(n);
        });
        return Q.all(array);
    };
};
