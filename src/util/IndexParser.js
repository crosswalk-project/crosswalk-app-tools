// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.



/**
 * Create an IndexParser object.
 * This is used to determine available versions from the Crosswalk download page.
 * @constructor
 * @param {String} data Index page data.
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

        var dirPrefix = '<img src="/icons/folder.gif" alt="[DIR]"> <a href="';
        if (line.substring(0, dirPrefix.length) == dirPrefix) {

            var version = line.substring(dirPrefix.length, line.indexOf('/"'));
            versions.push(version);
        }
    }

    return versions;
};

module.exports = IndexParser;
