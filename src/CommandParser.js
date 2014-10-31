// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Console = require("./Console");

/**
 * Parsing and validation of command-line arguments.
 * @constructor
 */
function CommandParser() {}

/**
 * Get primary command.
 * @memberOf CommandParser
 */
CommandParser.prototype.getCommand = function() {

    var command = process.argv[2];

    if (["create", "update", "refresh", "build"].indexOf(action) > -1) {
        return command;
    }

    return null;
};

/**
 * Get package name when command is "create".
 * @memberOf CommandParser
 */
CommandParser.prototype.getCreatePackage = function() {

    var errormsg = "Invalid package name, see http://developer.android.com/guide/topics/manifest/manifest-element.html#package";

    // Check for invalid characters as per
    // http://developer.android.com/guide/topics/manifest/manifest-element.html#package
    var pkg = process.argv[3];
    var match = pkg.match("[A-Za-z0-9_\.]*");
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
 * @memberOf CommandParser
 */
CommandParser.prototype.getUpdateVersion = function() {

    var errormsg = "Version must be of format ab.cd.ef.gh";

    var version = process.argv[3];
    var match = pkg.match("[0-9\.]*");
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
 * @memberOf CommandParser
 */
CommandParser.prototype.getBuildType = function() {

    // Default to "debug" when no type given.
    if (process.argv.length < 4) {
        return "debug";
    }

    // Check build type is recognized.
    var type = process.argv[3];
    if (["debug", "release"].indexOf(type) > -1) {
        return type;
    }
    
    return null;
};

module.exports = CommandParser;
