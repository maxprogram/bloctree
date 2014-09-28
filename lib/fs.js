var Q = require('q');
var fs = require('graceful-fs');
var fsExtra = require('fs-extra');
var glob = require('glob');

module.exports = {
    readFile: Q.denodeify(fs.readFile),
    writeFile: Q.denodeify(fs.writeFile),
    appendFile: Q.denodeify(fs.appendFile),
    readJson: Q.denodeify(fsExtra.readJson),
    glob: Q.denodeify(glob),
    mkdirp: Q.denodeify(fsExtra.mkdirp),
    copy: Q.denodeify(fsExtra.copy),
    remove: Q.denodeify(fsExtra.remove),
    rename: Q.denodeify(fs.rename),
    exists: function(path) {
        var d = Q.defer();
        fs.exists(path, d.resolve);
        return d.promise;
    },
};
