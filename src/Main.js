// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");
var FS = require("fs");
var OS = require("os");

var Minimist = require("minimist");
var ShellJS = require("shelljs");
var ChildProcess = require("child_process");

var Application = require("./Application");
var CommandParser = require("./CommandParser");
var PlatformBase = require("./PlatformBase");
var PlatformsManager = require("./PlatformsManager");
var TerminalOutput = require("./TerminalOutput");
var util = require("./util/index.js");

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
 * @private
 * @static
 */
Main.prototype.instantiatePlatform =
function() {

    var output = this.output;
    var errorDetail = null;

    var mgr = new PlatformsManager(output);
    var platformInfo = mgr.load(this.manifest.targetPlatforms,
                                function(errormsg) {
                                    errorDetail = errormsg;
                                });
    if (platformInfo) {
        output.info("Loading '" + platformInfo.platformId + "' platform backend");
    } else {
        if (errorDetail)
            output.error(errorDetail);
        output.error("Failed to load '" + platformInfo.platformId + "' platform backend");
        return null;
    }

    var platform = platformInfo.create(this);

    return platform;
};

/**
 * Have platform implementations check the host setup.
 * @param {String[]} platformIds Platforms to check, null or empty array checks all.
 * @param {OutputIface} output Output to write to
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.check =
function(platformIds, output, callback) {

    var mgr = new PlatformsManager(output);

    var platforms = [];
    if (platformIds && platformIds.length > 0) {

        platformIds.forEach(function (platformId) {
            var errormsg = null;
            var platformInfo = mgr.load(platformId,
                                        function (errormsg_) {
                errormsg = errormsg_;
            });
            if (platformInfo) {
                platforms.push(platformInfo);
            } else {
                output.error(errormsg);
                output.error("Failed to load platform '" + platformId + "'");
                callback(MAIN_EXIT_CODE_ERROR);
                return;
            }
        });

    } else {
        platforms = mgr.loadAll();
    }

    if (!platforms || platforms.length === 0) {
        output.error("Failed to load platform modules");
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    function checkPlatform(platformInfo, next) {

        if (platformInfo.Ctor.check) {
            output.info("Checking host setup for target " + platformInfo.platformId);
            platformInfo.Ctor.check(output,
                                    function(success) {
                next();
            });

        } else {
            output.warning("Skipping '" + platformInfo.platformId + "': 'check' not implemented");
            next();
        }
    }

    util.iterate(platforms, checkPlatform,
                 function () {

        callback(MAIN_EXIT_CODE_OK);
    });
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

    // Handle "platform" arg to set default platform
    // for new project.
    var platform = extraArgs.platforms;
    if (platform) {
        try {
            this.manifest.targetPlatforms = platform;
        } catch (e) {
            output.error("Invalid target platform '" + platform + "'");
            callback(MAIN_EXIT_CODE_ERROR);
            return;
        }
    }

    // Copy sample web app content
    var templatePath = Path.normalize(Path.join(__dirname, "..", "app-template"));
    if (!ShellJS.test("-d", templatePath)) {
        output.error("Could not find app template in " + templatePath);
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }
    output.info("Copying app template from " + templatePath);
    ShellJS.cp("-r", Path.join(templatePath, "*"), this.appPath);

    var project = this.instantiatePlatform();
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
            output.info("Logfiles at " + this.logPath);
            callback(MAIN_EXIT_CODE_ERROR);
            return;
        } else {
            callback(MAIN_EXIT_CODE_OK);
            return;
        }
    }.bind(this));
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

    var project = this.instantiatePlatform();
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
            output.info("Logfiles at " + this.logPath);
            callback(MAIN_EXIT_CODE_ERROR);
            return;
        } else {
            callback(MAIN_EXIT_CODE_OK);
            return;
        }
    }.bind(this));
};

/**
 * Check if webp convert tool exists. 
 * @static
 */
Main.prototype.checkWebp =
function() {

    var platform = OS.platform();

    if (platform == "windows")
        cwebpName = "cwebp.exe";
    else
        cwebpName = "cwebp";

    var webpPath = Path.join(__dirname, "cwebp");
    if (ShellJS.test("-e", webpPath))
        return true;

    this.output.write("Please download webp convert tool from: http://downloads.webmproject.org/releases/webp\n");
    return false;
}

/**
 * Convert png/jpeg images to webp. 
 * @param {String} path Images under this path will be converted
 * @static
 */
Main.prototype.convertWebP =
function(path, args) {
    argsList = args.split(/[ ,]+/);
    jpegQuality = argsList[0];
    pngQuality = argsList[1];
    pngAlphaQuality = argsList[2];

    var walk = function(dir) {
        var results = [];
        var list = FS.readdirSync(dir);
        list.forEach(function(file) {
            file = dir + "/" + file;
            var stat = FS.statSync(file);
            if (stat && stat.isDirectory())
                results = results.concat(walk(file));
            else
                results.push(file);
        })
        return results;
    }

    var fileList = walk(path);
    var webpPath = Path.join(__dirname, "cwebp");
    for (var i in fileList) {
        if (FS.lstatSync(fileList[i]).isFile()) {
            var filePath = fileList[i];
            var tmpFilePath = filePath + ".webp";
            var ext = Path.extname(filePath);
            if (".jpeg" == ext || ".jpg" == ext) {
                ChildProcess.execSync(webpPath +
                                      " " + filePath +
                                      " -q " + jpegQuality +
                                      " -o " + tmpFilePath,
                                      {stdio:[]});
                ShellJS.mv("-f", tmpFilePath, filePath);
            } else if (".png" == ext) {
                ChildProcess.execSync(webpPath +
                                      " " + filePath +
                                      " -q " + pngQuality +
                                      " -alpha_q " + pngAlphaQuality + 
                                      " -o " + tmpFilePath,
                                      {stdio:[]});
                ShellJS.mv("-f", tmpFilePath, filePath);
            }
        }
    }
  
}

/**
 * Build application package.
 * @param {String} configId Build "debug" or "release" configuration
 * @param {Object} extraArgs Unparsed extra arguments passed by command-line
 * @param {Main~mainOperationCb} callback Callback function
 * @static
 */
Main.prototype.build =
function(configId, args, callback) {

    var output = this.output;

    // Check we're inside a project
    /* TODO move this inside the AndroidProject
    if (!workingDirectoryIsProject()) {
        output.error("This does not appear to be a Crosswalk project.");
        callback(false);
        return;
    }
    */

    var project = this.instantiatePlatform();
    if (!project) {
        callback(MAIN_EXIT_CODE_ERROR);
        return;
    }

    if (2 == args._.length) {
        var target = args._[args._.length-1];
        if ("release" == target)
            target = "release";
    }

    var _build = function() {
        // Build
        project.build(configId, {}, function(errormsg) {

            if (errormsg) {
                output.error(errormsg);
                callback(MAIN_EXIT_CODE_ERROR);
                return;
            } else {
                callback(MAIN_EXIT_CODE_OK);
                return;
            }
        });
    }

    var appPath = Path.join(Path.dirname(Path.dirname(project.platformPath)), "app");
    var wwwPath = Path.join(Path.join(project.platformPath, "assets"), "www");

    if (args["android-webp"]) {
        if (ShellJS.test("-e", wwwPath)) {
            if (ShellJS.test("-L", wwwPath)) {
                ShellJS.rm("-f", wwwPath)
            } else {
                ShellJS.rm("-r", wwwPath)
            }
        }
        ShellJS.mkdir("-p", wwwPath)
        ShellJS.cp("-R", appPath+"/*", wwwPath)
        if (this.checkWebp()) {
            this.convertWebP(wwwPath, args["android-webp"])
            _build();
        }

    } else {
        if (ShellJS.test("-e", wwwPath)) {
            if (!ShellJS.test("-L", wwwPath)) {
                ShellJS.rm("-r", wwwPath)
                ShellJS.ln("-s", appPath, wwwPath);
            } 
        }
        _build();
    }
};

/**
 * Display available backends.
 * @param {OutputIface} output Output to write to
 * @static
 */
Main.prototype.listPlatforms =
function(output) {

    var mgr = new PlatformsManager(output);
    var backends = mgr.loadAll();

    for (var i = 0; i < backends.length; i++) {
        output.write("  * " + backends[i].platformId + "\n");
    }
};

/**
 * Display usage information.
 * @param {CommandParser} parser Parser instance
 * @param {OutputIface} output Output to write to
 * @static
 */
Main.prototype.printHelp =
function(parser, output) {

    // Builtin args
    var buf = parser.help();
    output.write(buf + "\n");

    // Platform args
    var mgr = new PlatformsManager(output);
    var infos = mgr.loadAll();
    for (var i = 0; i < infos.length; i++) {

        var platformInfo = infos[i];

        // Print args
        if (Object.keys(platformInfo.argSpec).length > 0) {
            output.write("Options for platform '" + platformInfo.platformId + "'\n");
            for (var cmd in platformInfo.argSpec) {
                output.write("\n    For command '" + cmd + "'\n");
                var cmdArgs = platformInfo.argSpec[cmd];
                for (var arg in cmdArgs) {
                    output.write("        " + arg + "    " + cmdArgs[arg] + "\n");
                }
            }
        }

        // Print environment variables
        if (Object.keys(platformInfo.envSpec).length > 0) {
            output.write("\nEnvironment variables for platform '" + platformInfo.platformId + "'\n\n");
            for (var env in platformInfo.envSpec) {
                output.write("    " + env + "               " + platformInfo.envSpec[env] + "\n");
            }
        }

        output.write("\n");
    }
};

/**
 * Display version information.
 * @param {OutputIface} output Output to write to
 * @static
 */
Main.prototype.printVersion =
function(output) {

    var Package = require("../package.json");

    output.write(Package.version + "\n");
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
    var app = new Main();
    var rootDir = null;

    if (process.argv.length < 3) {
        // No command given, print help and exit without error code.
        app.printHelp(parser, output);
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
    case "check":
        var platforms = parser.checkGetPlatforms();
        app.check(platforms, output, callback);
        break;

    case "create":
        var packageId = parser.createGetPackageId();

        // Chain up the constructor.
        Application.call(app, process.cwd(), packageId);
        app.create(packageId, extraArgs, callback);
        break;

    case "update":
        var version = parser.updateGetVersion();
        rootDir = parser.updateGetDir();

        // Chain up the constructor.
        Application.call(app, rootDir, null);
        app.update(version, extraArgs, callback);
        break;

    case "build":
        var type = parser.buildGetType();
        rootDir = parser.buildGetDir();

        // Chain up the constructor.
        Application.call(app, rootDir, null);
        app.build(type, extraArgs, callback);
        break;

    case "platforms":
        app.listPlatforms(output);
        break;

    case "help":
        app.printHelp(parser, output);
        break;

    case "version":
        app.printVersion(output);
        break;

    default:
        output.error("Unhandled command " + cmd);
        callback(MAIN_EXIT_CODE_ERROR);
    }
};

module.exports = new Main();
