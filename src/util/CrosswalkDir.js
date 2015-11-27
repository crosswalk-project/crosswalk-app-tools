// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.


var FS = require("fs");
var Path = require("path");

var ShellJS = require("shelljs");

var Version = require("./Version");



/**
 * Entry object
 * @constructor
 * @inner
 * @memberOf CrosswalkDir
 */
function Entry(path) {

    this._path = path;
}

/**
 * Path to file/dir.
 * @member {String} path
 * @instance
 * @memberOf Entry
 */
Object.defineProperty(Entry.prototype, "path", {
                      get: function() {
                                return this._path;
                           }
                      });

/**
 * Read entry contents
 * @returns {String} contents.
 */
Entry.prototype.getData =
function() {
    return FS.readFileSync(this._path, {"encoding": "utf8"});
};

Entry.prototype.toString =
function() {
    return this._path;
};



/**
 * Creates a CrosswalkDir object.
 * @param {String} path Path to crosswalk build xwalk_app_template
 * @constructor
 */
function CrosswalkDir(path) {

    this._path = path;
    this._root = "./";

    var versionFilePath = Path.join(path, "VERSION");
    if (ShellJS.test("-f", versionFilePath)) {
        this._version = Version.createFromFile(versionFilePath);
    } else {
        this._version = Version.createFromPath(path);
    }

    if (!this._version) {
        throw new Error("Failed to determine crosswalk version");
    }
}

/**
 * Version instance.
 * @member {Version} version
 * @instance
 * @memberOf CrosswalkDir
 */
Object.defineProperty(CrosswalkDir.prototype, "version", {
                      get: function() {
                                return this._version;
                           }
                      });

/**
 * Root entry name.
 * @member {String} root
 * @instance
 * @memberOf CrosswalkDir
 */
Object.defineProperty(CrosswalkDir.prototype, "root", {
                      get: function() {
                                return this._root;
                           }
                      });

/**
 * Get zip entry for path.
 * @param {String} path Path inside zip file
 * @returns {Object} Entry
 */
CrosswalkDir.prototype.getEntry =
function(path) {

    var absPath = Path.join(this._path, path);
    if (ShellJS.test("-e", absPath)) {
        return new Entry(absPath);
    }

    return null;
};

/**
 * Extract zip entry to path.
 * @param {Object} entry Zip entry
 * @param {String} path Path to extract to
 */
CrosswalkDir.prototype.extractEntryTo =
function(entry, path) {

    var entryPath = entry.path;
    if (ShellJS.test("-d", entry.path)) {
        entryPath = Path.join(entry.path, "*");
    }

    ShellJS.cp("-rf", entryPath, path);
    return true;
};



module.exports = CrosswalkDir;
