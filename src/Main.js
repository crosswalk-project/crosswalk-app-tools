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
        output.info("Loading '" + platformInfo.platformId + "' platform backend");
    } else {
        output.error("Failed to load '" + platformInfo.platformId + "' platform backend");
        return null;
    }

    // See type PlatformData
    var platformData = {
        application: this,
        platformId: platformInfo.platformId,
        argSpec: platformInfo.argSpec
    };
    var platform = null;

    try {
        platform = new platformInfo.Ctor(PlatformBase, platformData);
    } catch (e) {
        output.error("Failed to load '" + platformInfo.platformId + "' platform backend");
        return null;
    }

    return platform;
};

/**
 * Collect arguments
 */
Main.prototype.collectArgs =
function(platformId, allArgs, argsSpec) {

    // Collect backend-specific args
    var args = {};
    for (var key in argsSpec) {
        // Strip dash prefix before matching, Minimist strips them also.
        var key_ = key.substring("--".length);
        if (allArgs && allArgs[key_]) {
            // Also strip platform prefix before collecting the arg.
            var argPrefix = platformId + "-";
            var argName = key_.substring(argPrefix.length);
            args[argName] = allArgs[key_];
        }
    }

    return args;
};

/**
 * Create skeleton project.
 * @param {String} packageId Package ID
 * @param {Object} extraArgs Unparsed extra arguments passed by command-line
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.create =
function(packageId, extraArgs, callback) {

    var output = this.output;

    // Copy sample web app content
    var templatePath = Path.normalize(Path.join(__dirname, "..", "app-template"));
    if (!ShellJS.test("-d", templatePath)) {
        output.error("Could not find app template in " + templatePath);
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }
    output.info("Copying app template from " + templatePath);
    ShellJS.cp("-r", Path.join(templatePath, "*"), this.appPath);

    var project = this.instantiateProject();
    if (!project) {
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    // Collect args for this command
    var createArgs = {};
    var argSpec = project.argSpec;
    if (argSpec && argSpec.create) {
        createArgs = this.collectArgs(project.platformId, extraArgs, argSpec.create);
    }

    project.create(packageId, createArgs, function(errormsg) {

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
 * @param {Object} extraArgs Unparsed extra arguments passed by command-line
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.update =
function(version, extraArgs, callback) {

    var output = this.output;

    var project = this.instantiateProject();
    if (!project) {
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    // Collect args for this command
    var updateArgs = {};
    var argSpec = project.argSpec;
    if (argSpec && argSpec.update) {
        updateArgs = this.collectArgs(project.platformId, extraArgs, argSpec.update);
    }

    project.update(version, updateArgs, function(errormsg) {

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
 * @param {String} configId Build "debug" or "release" configuration
 * @param {Object} extraArgs Unparsed extra arguments passed by command-line
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.build =
function(configId, extraArgs, callback) {

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

    // Collect args for this command
    var buildArgs = {};
    var argSpec = project.argSpec;
    if (argSpec && argSpec.build) {
        buildArgs = this.collectArgs(project.platformId, extraArgs, argSpec.build);
    }

    // Build
    project.build(configId, buildArgs, function(errormsg) {

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

    if (platformInfo.argSpec) {
        output.write("Options for platform '" + platformInfo.platformId + "'\n");
        for (var cmd in platformInfo.argSpec) {
            output.write("\n    For command '" + cmd + "'\n");
            var cmdArgs = platformInfo.argSpec[cmd];
            for (var arg in cmdArgs) {
                output.write("        " + arg + "    " + cmdArgs[arg] + "\n");
            }
        }
    }

    if (platformInfo.platformId != 'ios') {
        output.write("Environment Variables\n\n");
        output.write("    CROSSWALK_APP_TOOLS_CACHE_DIR\t\tKeep downloaded files in this dir\n");
    }
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

    var extraArgs = Minimist(process.argv.slice(2));
    switch (cmd) {
    case "create":
        var packageId = parser.createGetPackageId();

        // Chain up the constructor.
        Application.call(this, process.cwd(), packageId);

        this.create(packageId, extraArgs, callback);
        break;

    case "update":
        var version = parser.updateGetVersion();

        // Chain up the constructor.
        Application.call(this, process.cwd(), null);

        this.update(version, extraArgs, callback);
        break;

    case "build":
        var type = parser.buildGetType();

        // Chain up the constructor.
        Application.call(this, process.cwd(), null);

        this.build(type, extraArgs, callback);
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
