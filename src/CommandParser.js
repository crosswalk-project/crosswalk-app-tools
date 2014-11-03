// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Console = require("./Console");

/**
 * Parsing and validation of command-line arguments.
 * @param {String[]} argv Command-line arguments.
 * @throws {TypeError} When argv is not an array.
 * @constructor
 */
function CommandParser(argv) {

    if (!(argv instanceof Array)) {
        throw new TypeError("CommandParser(argv) must be of type Array.");
    }

    this._argv = argv;
}

/**
 * Check whether the current instance represents a valid command.
 * @returns {Boolean} true if valid, otherwise false.
 * @memberOf CommandParser
 */
CommandParser.prototype.check = function() {

    var cmd = this.getCommand();
    switch (cmd) {
    case "create":
        var pkg = this.createGetPackage();
        return pkg !== null;
    case "update":
        var version = this.updateGetVersion();
        return version !== null;
    case "build":
        var type = this.buildGetType();
        return type !== null;
    default:
        // fall through
    }

    return false;
};

/**
 * Get primary command.
 * @returns {String} One of "create", "update", "refresh", "build" or null.
 * @memberOf CommandParser
 */
CommandParser.prototype.getCommand = function() {

    if (this._argv.length < 3) {
        return null;
    }

    var command = this._argv[2];

    if (["create", "update", "refresh", "build"].indexOf(command) > -1) {
        return command;
    }

    return null;
};

/**
 * Get package name when command is "create".
 * @returns {String} Package name as per Android conventions or null.
 * @memberOf CommandParser
 * @see {@link http://developer.android.com/guide/topics/manifest/manifest-element.html#package}
 */
CommandParser.prototype.createGetPackage = function() {

    var errormsg = "Invalid package name, see http://developer.android.com/guide/topics/manifest/manifest-element.html#package";

    if (this._argv.length < 4) {
        return null;
    }

    // Check for invalid characters as per
    // http://developer.android.com/guide/topics/manifest/manifest-element.html#package
    var pkg = this._argv[3];
    var match = pkg.match("[A-Za-z0-9_\\.]*");
    if (match[0] != pkg) {
        Console.error(errormsg);
        return null;
    }

    // Package name must not start or end with '.'
    if (pkg[0] == '.' || pkg[pkg.length - 1] == '.') {
        Console.error(errormsg);
        Console.error("Name must not start or end with '.'");
        return null;
    }

    // Require 3 or more elements.
    var parts = pkg.split('.');
    if (parts.length < 3) {
        Console.error(errormsg);
        Console.error("Name needs to consist of 3+ elements");
        return null;
    }

    return pkg;
};

/**
 * Get version when command is "update".
 * @returns {String} Crosswalk version string or null.
 * @memberOf CommandParser
 * @see {@link https://crosswalk-project.org/documentation/downloads.html}
 */
CommandParser.prototype.updateGetVersion = function() {

    var errormsg = "Version must be of format ab.cd.ef.gh";

    if (this._argv.length < 4) {
        return null;
    }

    var version = this._argv[3];
    var match = version.match("[0-9\\.]*");
    if (match[0] != version) {
        Console.error(errormsg);
        return null;
    }

    var parts = version.split('.');
    if (parts.length != 4) {
        Console.error(errormsg);
        return null;
    }

    return version;
};

/**
 * Get build type when command is "build".
 * @returns {String} One of "debug", "release", or null.
 * @memberOf CommandParser
 */
CommandParser.prototype.buildGetType = function() {

    if (this._argv.length < 3) {
        return null;
    }

    // Default to "debug" when no type given.
    if (this._argv.length < 4) {
        return "debug";
    }

    // Check build type is recognized.
    var type = this._argv[3];
    if (["debug", "release"].indexOf(type) > -1) {
        return type;
    }

    return null;
};

module.exports = CommandParser;
