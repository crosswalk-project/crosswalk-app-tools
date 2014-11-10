// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var AndroidProject = require("./AndroidProject");
var AndroidSDK = require("./AndroidSDK");
var CommandParser = require("./CommandParser");
var Console = require("./Console");

/**
 * Main script.
 * @namespace main
 */

/**
 * Create skeleton project.
 * @param {String} packageId Identifier in the form of com.example.Foo
 * @memberOf main
 * @private
 */
function create(packageId) {

    var sdk = null;
    try {
        sdk = new AndroidSDK();
    } catch (e) {
        Console.error("Error: The Android SDK could not be found. " +
                      "Make sure the directory containing the 'android' " +
                      "executable is mentioned in the PATH environment variable.");
        return;
    }

    var minApiLevel = 14;
    var apiTarget;
    sdk.queryTarget(minApiLevel,
                    function(apiTarget, errormsg) {

        if (!apiTarget || errormsg) {
            Console.error("Error: Failed to find Android SDK target API >= " + minApiLevel + " " +
                          "Try running 'android list targets' to check.");
            return;
        }

        sdk.generateProjectTemplate(packageId, apiTarget,
                                    function(path, logMsg, errormsg) {

            if (!path || errormsg) {
                Console.error("Error: Failed to create project template TODO better message");
                return;
            }

            Console.log("Project template created at '" + path + "'");
        });
    });
}

/**
 * Display usage information.
 * @param {CommandParser} parser.
 * @memberOf main
 * @private
 */
function help(parser) {

    var buf = parser.help();
    console.log(buf);
}

/**
 * Display version information.
 * @memberOf main
 * @private
 */
function version() {

    console.log("-0 TODO fetch this from project.json");
}

var parser = new CommandParser(process.argv);
var cmd = parser.getCommand();
if (cmd) {

    switch (cmd) {
    case "create":
        var packageId = parser.createGetPackageId();
        create(packageId);
        break;
    case "update":
        var version = parser.updateGetVersion();
        console.log("TODO implement");
        break;
    case "build":
        var type = parser.buildGetType();
        console.log("TODO implement");
        break;
    case "help":
        help(parser);
        break;
    case "version":
        version();
        break;
    default:
        // TODO
    }

} else {

    help(parser);
}