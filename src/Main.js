// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var Minimist = require("minimist");
var ShellJS = require("shelljs");

var Application = require("./Application");
var CommandParser = require("./CommandParser");
var PlatformBase = require("./PlatformBase");
var PlatformsManager = require("./PlatformsManager");
var TerminalOutput = require("./TerminalOutput");

var MAIN_EXIT_CODE_OK = 0;
var MAIN_EXIT_CODE_ERROR = 127;

/**
 * Callback signature for toplevel operations.
 * @param {Number} errno 0 on operation completion, otherwise error number
 * @inner
 * @memberOf Main
 */
function mainOperationCb(errno) {}

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
function() {

    var output = this.output;

    var mgr = new PlatformsManager(output);
    var platformInfo = mgr.loadDefault();
    if (platformInfo) {
        output.info("Using backend '" + platformInfo.platformId + "'");
    } else {
        output.error("Failed to load platform backend");
        return null;
    }

    // Collect backend-specific args
    var allArgs = Minimist(process.argv.slice(2));
    var args = {};
    for (var key in platformInfo.args) {
        // Strip dash prefix before matching, Minimist strips them also.
        var key_ = key.substring("--".length);
        if (allArgs[key_]) {
            // Also strip platform prefix before collecting the arg.
            var argPrefix = platformInfo.platformId + "-";
            var argName = key_.substring(argPrefix.length);
            args[argName] = allArgs[key_];
        }
    }

    var baseData = {
        application: this,
        platformId: platformInfo.platformId
    };
    var platform = null;

    try {
        platform = new platformInfo.Ctor(PlatformBase, baseData, args);
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
 * @param {Object} options Extra options for the command
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.create =
function(options, callback) {

    var output = this.output;

    // Copy sample web app content
    ShellJS.cp("-r",
               Path.join(__dirname, "..", "data", "www", "*"),
               this.appPath);

    var project = this.instantiateProject();
    if (!project) {
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    project.generate(options, function(errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback(MAIN_EXIT_CODE_ERROR);
            return;
        } else {
            callback(MAIN_EXIT_CODE_OK);
            return;
        }
    });
};

/**
 * Update crosswalk in the application package.
 * @param {String} version Version to update to, or null for latest stable version
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.update =
function(version, callback) {

    var output = this.output;

    var project = this.instantiateProject();
    if (!project) {
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    project.update(version, {}, function(errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback(MAIN_EXIT_CODE_ERROR);
            return;
        } else {
            callback(MAIN_EXIT_CODE_OK);
            return;
        }
    });
};

/**
 * Build application package.
 * @param {String} type Build "debug" or "release" configuration
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.build =
function(type, callback) {

    var output = this.output;

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
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    // Build
    var abis = ["armeabi-v7a", "x86"];
    var release = type === "release" ? true : false;
    project.build(abis, release, function(errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback(MAIN_EXIT_CODE_ERROR);
            return;
        } else {
            callback(MAIN_EXIT_CODE_OK);
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

    var output = TerminalOutput.getInstance();

    // Builtin args
    var buf = parser.help();
    output.write(buf + "\n");

    // Platform args
    var mgr = new PlatformsManager(output);
    var platformInfo = mgr.loadDefault();
    if (!platformInfo) {
        output.error("Failed to load platform backend");
        return;
    }

    if (platformInfo.args) {
        output.write("    Options for platform '" + platformInfo.platformId + "'\n");
        for (var arg in platformInfo.args) {
            output.write("        " + arg + "    " + platformInfo.args[arg] + "\n");
        }
    }
    output.write("\n");

    output.write("    Environment Variables\n");
    output.write("        CROSSWALK_APP_TOOLS_CACHE_DIR\t\tKeep downloaded files in this dir\n");
    output.write("\n");
};

/**
 * Display version information.
 * @static
 */
Main.prototype.printVersion =
function() {

    var Package = require("../package.json");
    // Do not use output infrastructure because this is
    // a static method, so the parent is not initialised.
    console.log(Package.version + "\n");
};

/**
 * Main entry point.
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.run =
function(callback) {

    // Temporary output object because of static method here
    var output = TerminalOutput.getInstance();
    var parser = new CommandParser(output, process.argv);

    if (process.argv.length < 3) {
        // No command given, print help and exit without error code.
        this.printHelp(parser);
        callback(MAIN_EXIT_CODE_OK);
        return;
    }

    // Unknown or bogus command?
    var cmd = parser.getCommand();
    if (!cmd) {
        output.error("Unhandled command '" + process.argv[2] + "'");
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    var options = null;
    switch (cmd) {
    case "create":
        var packageId = parser.createGetPackageId();
        options = parser.createGetOptions();

        // Chain up the constructor.
        Application.call(this, process.cwd(), packageId);

        this.create(options, callback);
        break;

    case "update":
        var version = parser.updateGetVersion();

        // Chain up the constructor.
        Application.call(this, process.cwd(), null);

        this.update(version, callback);
        break;

    case "build":
        var type = parser.buildGetType();

        // Chain up the constructor.
        Application.call(this, process.cwd(), null);

        this.build(type, callback);
        break;

    case "help":
        this.printHelp(parser);
        break;

    case "version":
        this.printVersion();
        break;

    default:
        output.error("Unhandled command " + cmd);
        callback(MAIN_EXIT_CODE_ERROR);
    }

    callback(MAIN_EXIT_CODE_OK);
};

module.exports = new Main();
