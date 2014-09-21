var Q = require('q');
var fs = require('graceful-fs');
var fsExtra = require('fs-extra');
var glob = require('glob');

module.exports = {
    readFile: Q.denodeify(fs.readFile),
    writeFile: Q.denodeify(fs.writeFile),
    glob: Q.denodeify(glob),
    mkdirp: Q.denodeify(fsExtra.mkdirp),
    copy: Q.denodeify(fsExtra.copy),
    remove: Q.denodeify(fsExtra.remove),
};
