var _ = require('lodash');
var Q = require('q');


exports.mapPromise = function(func) {
    return function(array) {
        array = _.map(array, function(v, k) {
            return Q.promised(func)(v, k);
        });
        return Q.all(array);
    };
};
