var _ = require('lodash');
var Q = require('q');
var crypto = require('crypto');


exports.createUniqueId = function createUniqueId(ids) {
    // 4 bytes = 0 to 4,294,967,296
    var hash = crypto.randomBytes(4).toString('hex');
    if (_.isArray(ids) && ids.indexOf(hash)>=0) {
        return createUniqueId(ids);
    }
    return hash;
};

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
