// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.



/**
 * Create an IndexParser object.
 * This is used to determine available versions from the Crosswalk download page.
 * @constructor
 * @param {String} data Index page data
 */
function IndexParser(data) {

    this._data = data;
}

/**
 * Parse page and return available versions (subdirectories).
 * @returns {String[]} Array of versions in w.x.y.z format.
 */
IndexParser.prototype.parse =
function() {

    var parentDirRegex = /Parent Directory/i;

    // ignore all lines until we get to the first one after
    // "Parent Directory"
    var lines = this._data.split('\n');
    var versions = [];

    for (var i = 0; i < lines.length; i += 1) {

        var line = lines[i];
        if (parentDirRegex.test(line)) {
            continue;
        }

        // Also ignore symlink "latest"
        var latestPrefix = '<img src="/icons/folder.gif" alt="[DIR]"> <a href="latest';
        if (line.substring(0, latestPrefix.length) == latestPrefix) {
            continue;
        }

        var dirPrefix = '<img src="/icons/folder.gif" alt="[DIR]"> <a href="';
        if (line.substring(0, dirPrefix.length) == dirPrefix) {

            var version = line.substring(dirPrefix.length, line.indexOf('/"'));
            versions.push(version);
        }
    }

    return versions;
};

/**
 * Pick latest version from array of version strings.
 * @param {String[]} versions Array of version strings
 * @param {Function} errorCb Synchronous callback delivering error message
 * @returns {String} Latest version or null on error.
 * @static
 */
IndexParser.pickLatest =
function(versions, errorCb) {

    if (!(versions instanceof Array) ||
        versions.length === 0) {

        errorCb("No available Crosswalk versions found");
        return null;
    }

    var zero = [0, 0, 0, 0];
    var latest = zero;
    for (var i = 0; i < versions.length; i++) {

        // Split up version string.
        var v = versions[i].split(".");
        if (v.length != 4) {
            errorCb("Invalid Crosswalk version '" + versions[i] + "'");
            return null;
        }

        // Check against latest remembered version.
        var j = 0;
        for (j = 0; j < 4; j++) {
            if (+v[j] > +latest[j]) {
                // Tested version is greater than what we have.
                latest = v;
                break;
            }
        }
    }

    // Make sure we found a version, return null otherwise.
    return latest != zero ? latest.join(".") : null;
};

module.exports = IndexParser;
