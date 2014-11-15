var _ = require('lodash');
var fs = require('./fs');
var Q = require('q');
var path = require('path');
var util = require('./util');


module.exports = {
    getMigrations: getMigrations,
    runMigrations: runMigrations
};

/** GETS MIGRATIONS FROM /migrations
 * Migration should be in the form of:
 * module.exports = function(blocPath) { return Q(true); }
 */
function getMigrations(version) {
    var dir = path.join(__dirname, '..', 'migrations');
    return fs.glob(dir + '/*').then(function(migs) {
        migs.push(version + '.js');
        var splits = migs.map(function(m) {
            return { path: m, v: path.basename(m, '.js')
                .split('.')
                .map(function(n) { return parseFloat(n); }) };
        });

        // Sort descending from oldest to newest
        function sort(array, lvl) {
            return array.sort(function(a, b) {
                if (a.v[lvl] < b.v[lvl]) return -1;
                if (a.v[lvl] > b.v[lvl]) return  1;
                return 0;
            });
        }
        splits = sort(splits, 2);
        splits = sort(splits, 1);
        splits = sort(splits, 0);

        return splits;
    });
}

/** Runs migrations on more recent versions
 * @param {string} blocPath Path of the bloctree folder
 * @param {string} toVersion Version to migrate to
 *                           (defaults to most recent)
 * @returns {promise:array} [{ version:{string}, migrated:{boolean} }]
 */
function runMigrations(blocPath, toVersion) {
    var blocFile = path.join(blocPath, 'bloc.json');
    var bloc = require(blocFile);
    var version = bloc.bloctree;

    return getMigrations(version).then(function(migs) {
        // Remove prior migration versions
        function find(v, reverse) {
            var idx = _.findIndex(migs, function(mig) {
                return mig.v.join('.') == v;
            }) + 1;
            if (reverse) migs.splice(idx, migs.length-idx);
            else migs.splice(0, idx);
        }
        // Remove current migration version by running 2x
        find(version); find(version);
        // Only migrate up to toVersion
        if (toVersion) find(toVersion, true);

        // Run each migration in order
        return util.promiseSeries(migs, function(m) {
            var migration = require(m.path);
            if (!_.isFunction(migration)) return false;
            return migration(blocPath);
        }).then(function(results) {
            var lastMigration = version;
            // Prep results & get last migrated version
            results.forEach(function(r, i) {
                var v = migs[i].v.join('.');
                migs[i] = { version: v, migrated: r };
                if (r) lastMigration = v;
            });

            // Update bloctree version
            bloc.bloctree = lastMigration;
            return fs.writeFile(blocFile, JSON.stringify(bloc, null, 2));
        }).thenResolve(migs);
    });
}
