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

exports.bindModule = function(module, _this) {
    return _.reduce(module, function(obj, f, name) {
        obj[name] = f.bind(_this);
        return obj;
    }, {});
};
