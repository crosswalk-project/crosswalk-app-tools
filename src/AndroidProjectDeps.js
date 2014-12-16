// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ShellJS = require("shelljs");

var Config = require("./Config");

/**
 * Android project dependencies download and lookup.
 * @constructor
 */
function AndroidProjectDeps() {

}

/**
 * Locate Crosswalk distribution zip.
 * @function findCrosswalkZip
 * @returns {String} Relative path to zip file
 * @memberOf AndroidProjectDeps
 */
AndroidProjectDeps.prototype.findCrosswalkZip =
function() {

    var zips = ShellJS.ls('crosswalk-*.*.*.*.zip');
    if (zips.length === 0) {
        // Also try parent dir.
        // This is especially useful for tests that run in a temporary dir.
        zips = ShellJS.ls('../crosswalk-*.*.*.*.zip');
        if (zips.length === 0) {
            Console.error("Crosswalk Zip not found in current or parent directory " + ShellJS.pwd());
            return false;
        }
    }

    var zipFile = zips[zips.length - 1];

    return zipFile;
};

AndroidProjectDeps.prototype.downloadCrosswalkZip =
function() {

};

module.exports = AndroidProjectDeps;
