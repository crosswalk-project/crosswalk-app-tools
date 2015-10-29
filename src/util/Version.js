// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require("path");

/**
 * Representation of a four part Crosswalk version number.
 * @param {Number} major
 * @param {Number} minor
 * @param {Number} micro
 * @param {Number} build
 * @constructor
 */
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
 * Create Version instance from VERSION file.
 * @param {String} versionFilePath Path to VERSION file
 * @throws {Error} If file could not be found or read
 * @returns {Version} instance.
 */
Version.createFromFile =
function(versionFilePath) {

    // Extract version
    var buffer = FS.readFileSync(versionFilePath, {"encoding": "utf8"});
    var lines = buffer.split("\n");
    if (lines.length != 5) {
        throw new Error("Invalid VERSION file, expected 4 lines, got " + lines.length);
    }

    var names = ["major", "minor", "build", "patch"];
    var numbers = {};
    lines.forEach(function (line) {
        // Skip trailing empty line
        if (!line)
            return;
        var a = line.split("=");
        var name = a[0].toLowerCase();
        if (names.indexOf(name) < 0) {
            throw new Error("Invalid version number in VERSION file: " + name);
        }
        numbers[name] = +a[1];
    });

    return new Version(+numbers.major, +numbers.minor, +numbers.build, +numbers.patch);                    
};

/**
 * Create Version instance from path, by extracting version numbers.
 * @param {String} path Path to crosswalk directory
 * @throws {Error} If version numbers could not be extracted
 * @returns {Version} instance.
 */
Version.createFromPath =
function(path) {

    var basename = Path.basename(path);
    var a = basename.split("-");
    if (a[0] === "crosswalk") {
        var numbers = a[1].split(".");
        return new Version(+numbers[0], +numbers[1], +numbers[2], +numbers[3]);                    
    }

    throw new Error("Path doesn not seem to be a crosswalk directory " + path);
};

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

Version.prototype.toString =
function() {

    return this.major + "." + this.minor + "." + this.micro + "." + this.build;
};



module.exports = Version;
