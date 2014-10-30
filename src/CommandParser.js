// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Console = require("./Console");

function CommandParser() {}

CommandParser.prototype.getCommand = function() {

    var command = process.argv[2];

    if (["create", "update", "refresh", "build"].indexOf(action) > -1) {
        return command;
    }

    return null;
};

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

CommandParser.prototype.getUpdateVersion = function() {

    // TODO
};

CommandParser.prototype.getBuildType = function() {

    // TODO
};

module.exports = CommandParser;
