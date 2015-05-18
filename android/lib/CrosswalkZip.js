// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.


var Path = require('path');

var AdmZip = require("adm-zip");



function Version(major, minor, micro, build) {

    if (typeof major === "number" && major % 1 === 0)
        this._major = major;
    else
        throw new Error("Invalid major version number '" + major + "'");

    if (typeof minor === "number" && minor % 1 === 0)
        this._minor = minor;
    else
        throw new Error("Invalid minor version number '" + minor + "'");

    if (typeof micro === "number" && micro % 1 === 0)
        this._micro = micro;
    else
        throw new Error("Invalid micro version number '" + micro + "'");

    if (typeof build === "number" && build % 1 === 0)
        this._build = build;
    else
        throw new Error("Invalid build version number '" + build + "'");
}

/**
 * Major version.
 * @member {Number} major
 * @instance
 * @memberOf Version
 */
Object.defineProperty(Version.prototype, "major", {
                      get: function() {
                                return this._major;
                           }
                      });

/**
 * Minor version.
 * @member {Number} minor
 * @instance
 * @memberOf Version
 */
Object.defineProperty(Version.prototype, "minor", {
                      get: function() {
                                return this._minor;
                           }
                      });

/**
 * Micro version.
 * @member {Number} micro
 * @instance
 * @memberOf Version
 */
Object.defineProperty(Version.prototype, "micro", {
                      get: function() {
                                return this._micro;
                           }
                      });

/**
 * Build version.
 * @member {Number} build
 * @instance
 * @memberOf Version
 */
Object.defineProperty(Version.prototype, "build", {
                      get: function() {
                                return this._build;
                           }
                      });



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

CrosswalkZip.prototype.getEntry =
function(path) {

    return this._adm.getEntry(path);
};

CrosswalkZip.prototype.extractEntryTo =
function(entry, path) {

    return this._adm.extractEntryTo(entry, path, false, true);
};

CrosswalkZip.prototype.toString =
function() {

    return this.major + "." + this.minor + "." + this.micro + "." + this.build;
};

module.exports = CrosswalkZip;
