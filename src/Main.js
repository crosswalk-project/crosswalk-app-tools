// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ShellJS = require("shelljs");

var Application = require('./Application');
var CommandParser = require("./CommandParser");
var PlatformsManager = require("./PlatformsManager");

/**
 * Callback signature for toplevel operations.
 * @param {Boolean} success true on operation completion, otherwise false
 * @inner
 * @memberOf Main
 */
function mainOperationCb(success) {}

/**
 * Main class.
 *
 * For automated testing, every method of this class must be usable standlone,
 * that is without depending on prior invocation of any other method. This
 * is why they are labelled "static".
 *
 * @extends Application
 * @constructor
 * @private
 */
function Main() {
    // Chain up the constructor.
    Application.call(this);
}
Main.prototype = Application.prototype;

/* TODO move to android project
function workingDirectoryIsProject() {

    if (ShellJS.test("-f", "AndroidManifest.xml") &&
        ShellJS.test("-d", "xwalk_core_library")) {

        return true;
    }

    return false;
}
*/

/**
 * Instantiate platform backend
 * @returns {PlatformIface} Constructor for platform backend
 * @static
 */
Main.prototype.instantiateProject =
function() {

    var output = this.getOutput();
    var mgr = new PlatformsManager(this);
    var Platform = mgr.loadDefault();
    if (!Platform) {
        output.error("Failed to load platform backend");
        return null;
    }

    var platform;

    try {
        platform = new Platform(this);
    } catch (e) {
        output.error("The Android SDK could not be found. " +
                      "Make sure the directory containing the 'android' " +
                      "executable is mentioned in the PATH environment variable.");
        return null;
    }

    return platform;
};

/**
 * Create skeleton project.
 * @param {String} packageId Identifier in the form of com.example.foo
 * @param {Main~mainOperationCb} [callback] Callback function
 * @static
 */
Main.prototype.create =
function(packageId, callback) {

    var output = this.getOutput();

    // Handle callback not passed.
    if (!callback)
        callback = function() {};

    var project = this.instantiateProject();
    if (!project) {
        callback(false);
        return;
    }

    project.generate(packageId, function(errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback(false);
            return;
        } else {
            callback(true);
            return;
        }
    });
};

/**
 * Build application package.
 * @param {String} type Build "debug" or "release" configuration
 * @param {Main~mainOperationCb} [callback] Callback function
 * @static
 */
Main.prototype.build =
function(type, callback) {

    var output = this.getOutput();

    // Handle callback not passed.
    if (!callback)
        callback = function() {};

    // Check we're inside a project
    /* TODO move this inside the AndroidProject
    if (!workingDirectoryIsProject()) {
        output.error("This does not appear to be a Crosswalk project.");
        callback(false);
        return;
    }
    */

    var project = this.instantiateProject();
    if (!project) {
        callback(false);
        return;
    }

    // Build
    var abis = ["armeabi-v7a", "x86"];
    var release = type === "release" ? true : false;
    project.build(abis, release, function(errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback(false);
            return;
        } else {
            callback(true);
            return;
        }
    });
};

/**
 * Display usage information.
 * @param {CommandParser} parser Parser instance
 * @static
 */
Main.prototype.printHelp =
function(parser) {

    var buf = parser.help();
    this.getOutput().print(buf);
};

/**
 * Display version information.
 * @static
 */
Main.prototype.printVersion =
function() {

    var Package = require("../package.json");
    this.getOutput().print(Package.version);
};

/**
 * Main entry point.
 * @static
 */
Main.prototype.run =
function() {

    var parser = new CommandParser(this.getOutput(), process.argv);
    var cmd = parser.getCommand();
    if (cmd) {

        switch (cmd) {
        case "create":
            var packageId = parser.createGetPackageId();
            this.create(packageId);
            break;
        case "update":
            var version = parser.updateGetVersion();
            this.getOutput.warning("TODO implement");
            break;
        case "build":
            var type = parser.buildGetType();
            this.build(type);
            break;
        case "help":
            this.printHelp(parser);
            break;
        case "version":
            this.printVersion();
            break;
        default:
            // TODO
        }

    } else {

        this.printHelp(parser);
    }
};

module.exports = new Main();
