var _ = require('lodash');
var fs = require('./fs');
var Q = require('q');
var path = require('path');


exports.newFromTemplate = function(name, dest) {
    name = name.toLowerCase()
        .replace(/[_.]/g, '-')
        .replace(/[\/\\'"@#^!*:;<>?\(\)\{\}]/g, '');

    var tempFolder = path.join(__dirname, '..', 'template');
    var newFolder = path.join(dest, name);

    // Bulk copy 'template' folder
    return fs.exists(newFolder)
    .then(function(exists) {
        if (exists) return Q.reject(new Error('Folder "'+name+'" already exists'));
        return fs.copy(tempFolder, newFolder);
    })
    // Rename gitignore
    .then(function() {
        return fs.rename(
            path.join(newFolder, 'gitignore'),
            path.join(newFolder, '.gitignore')
        );
    })
    // Write bloc settings
    .then(function() {
        var blocFile = path.join(newFolder, 'bloc.json');
        var bloc = require(blocFile);
        bloc.name = name;
        bloc.created = new Date().toISOString();
        return fs.writeFile(blocFile, JSON.stringify(bloc, null, 2));
    })
    .thenResolve(newFolder);
};
