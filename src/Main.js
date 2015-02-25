// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var ShellJS = require("shelljs");

var Application = require("./Application");
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
    // Application.call(this);
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
 * @returns {PlatformBase} Platform implementation instance or null on error.
 * @static
 */
Main.prototype.instantiateProject =
function(packageId) {

    var output = this.output;

    if (!packageId) {
        // Name of current directory must be packageId, otherwise we can not continue.
        var basename = Path.basename(process.cwd());
        packageId = CommandParser.validatePackageId(basename, output);
        if (!packageId) {
            return null;
        }
    }

    var mgr = new PlatformsManager(this);
    var platformInfo = mgr.loadDefault();
    if (!platformInfo) {
        output.error("Failed to load platform backend");
        return null;
    }

    //function Frontend(application, baseDir, packageId, platformId) {

    var platform;

    try {
        platform = new platformInfo.Ctor(this);
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
 * @param {Object} options Extra options for the command
 * @param {Main~mainOperationCb} [callback] Callback function
 * @static
 */
Main.prototype.create =
function(packageId, options, callback) {

    var output = this.output;

    // Handle callback not passed.
    if (!callback)
        callback = function() {};

    var project = this.instantiateProject(packageId);
    if (!project) {
        callback(false);
        return;
    }

    project.generate(packageId, options, function(errormsg) {

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

    var output = this.output;

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

    var project = this.instantiateProject(null);
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
    this.output.print(buf);
};

/**
 * Display version information.
 * @static
 */
Main.prototype.printVersion =
function() {

    var Package = require("../package.json");
    this.output.print(Package.version);
};

/**
 * Main entry point.
 * @static
 */
Main.prototype.run =
function() {

    var parser = new CommandParser(this.output, process.argv);
    var cmd = parser.getCommand();
    var options = null;
    if (cmd) {

        switch (cmd) {
        case "create":
            var packageId = parser.createGetPackageId();
            options = parser.createGetOptions();
            this.create(packageId, options);
            break;
        case "update":
            var version = parser.updateGetVersion();
            this.output.warning("TODO implement");
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
