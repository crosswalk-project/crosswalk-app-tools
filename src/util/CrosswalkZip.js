// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.


var Path = require('path');

var AdmZip = require("adm-zip");

var Version = require("./Version");



/**
 * Creates a CrosswalkZip object.
 * @param {String} path Path to downloaded release
 * @constructor
 */
function CrosswalkZip(path) {

    this._adm = new AdmZip(path);

    // Derive root entry name from the filename
    var base = Path.basename(path, ".zip");
    this._root = base + "/";

    // Extract version
    var version = base.split("-")[1];
    var numbers = version.split(".");
    this._version = new Version(+numbers[0], +numbers[1], +numbers[2], +numbers[3]);
}

/**
 * Version instance.
 * @member {Version} version
 * @instance
 * @memberOf CrosswalkZip
 */
Object.defineProperty(CrosswalkZip.prototype, "version", {
                      get: function() {
                                return this._version;
                           }
                      });

/**
 * Root entry name.
 * @member {String} root
 * @instance
 * @memberOf CrosswalkZip
 */
Object.defineProperty(CrosswalkZip.prototype, "root", {
                      get: function() {
                                return this._root;
                           }
                      });

/**
 * Get zip entry for path.
 * @param {String} path Path inside zip file
 * @returns {Object} Entry
 */
CrosswalkZip.prototype.getEntry =
function(path) {

    return this._adm.getEntry(path);
};

/**
 * Extract zip entry to path.
 * @param {Object} entry Zip entry
 * @param {String} path Path to extract to
 */
CrosswalkZip.prototype.extractEntryTo =
function(entry, path) {

    // If dir and path does not exist, create it,
    // because adm-zip doesn't.
    if (path[path.length - 1] === "/" &&
        !ShellJS.test("-d", path)) {
        ShellJS.mkdir(path);
    }

    return this._adm.extractEntryTo(entry, path, false, true);
};



module.exports = CrosswalkZip;
