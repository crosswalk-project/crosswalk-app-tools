// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require("os");
var Path = require('path');

var ShellJS = require("shelljs");

var CommandParser = require("./CommandParser");
var IllegalAccessException = require("./util/exceptions").IllegalAccessException;
var LogfileOutput = require("./LogfileOutput");
var Manifest = require("./Manifest");
var OutputIface = require("./OutputIface");
var OutputTee = require("./OutputTee");
var TerminalOutput = require("./TerminalOutput");

/**
 * Create Application object.
 * If packageId is not passed, the current working directory needs to be right
 * inside the project, so that the directory name is the packageId.
 * @constructor
 * @param {String} cwd Current working directory
 * @param {String} [packageId] Package ID in com.example.foo format, or null
 * @throws {Error} If packageId not passed and current working dir not a project.
 * @protected
 */
function Application(cwd, packageId) {

    var output = TerminalOutput.getInstance();

    // cwd must be absolute and exist.
    if (!cwd ||
        Path.resolve(cwd) != Path.normalize(cwd)) {
        output.error("Path not absolute: " + cwd);
        throw new Error("Path not absolute: " + cwd);
    }
    if (!ShellJS.test("-d", cwd)) {
        output.error("Path does not exist: " + cwd);
        throw new Error("Path does not exist: " + cwd);
    }

    // PackageId is only passed when a new project is created.
    if (packageId) {

        this._packageId = CommandParser.validatePackageId(packageId, this.output);

        // Check that project dir not already exists
        var rootPath = Path.join(cwd, this._packageId);
        if (ShellJS.test("-d", rootPath)) {
            output.error("Failed to create project, path already exists: " + rootPath);
            throw new Error("Failed to create project, path already exists: " + rootPath);
        }

        initMembers.call(this, rootPath);

        // Create Manifest
        Manifest.create(Path.join(this._appPath, "manifest.json"), packageId);

    } else {

        // Get packageId from manifest
        var manifest = new Manifest(TerminalOutput.getInstance(), Path.join(cwd, "app", "manifest.json"));
        this._packageId = manifest.packageId;
        if (!this._packageId) {
            output.error("Path does not seem to be a project toplevel: " + cwd);
            throw new Error("Path does not seem to be a project toplevel: " + cwd);
        }

        initMembers.call(this, cwd);
    }

    // Check all paths exist.
    if (!ShellJS.test("-d", this._rootPath)) {
        output.error("Failed to load, invalid path: " + this._rootPath);
        throw new Error("Failed to load, invalid path: " + this._rootPath);
    }
    if (!ShellJS.test("-d", this._appPath)) {
        output.error("Failed to load, invalid path: " + this._appPath);
        throw new Error("Failed to load, invalid path: " + this._appPath);
    }
    if (!ShellJS.test("-d", this._logPath)) {
        output.error("Failed to load, invalid path: " + this._logPath);
        throw new Error("Failed to load, invalid path: " + this._logPath);
    }
    if (!ShellJS.test("-d", this._pkgPath)) {
        output.error("Failed to load, invalid path: " + this._pkgPath);
        throw new Error("Failed to load, invalid path: " + this._pkgPath);
    }
    if (!ShellJS.test("-d", this._prjPath)) {
        output.error("Failed to load, invalid path: " + this._prjPath);
        throw new Error("Failed to load, invalid path: " + this._prjPath);
    }

    // Set up logging, always start a new file for each time the app is run.
    var logfilePath = Path.join(this._logPath, "common.log");
    ShellJS.rm("-f", logfilePath);
    this._logfileOutput = new LogfileOutput(logfilePath);

    this._platformLogfileOutput = null;

    this._output = new OutputTee(this._logfileOutput, TerminalOutput.getInstance());

    this.loadManifest(Path.join(this._appPath, "manifest.json"));
    this._generatedPackage = null;
}

/**
 * Initialize paths.
 * @param {String} rootPath Root path inside the project
 */
function initMembers(rootPath) {

    this._rootPath = rootPath;
    ShellJS.mkdir(this._rootPath);

    this._appPath = this._rootPath + Path.sep + "app";
    ShellJS.mkdir(this._appPath);

    this._logPath = Path.join(OS.tmpdir(), "crosswalk-app-tools-" + this._packageId);
    ShellJS.mkdir(this._logPath);

    // Packages end up in working dir
    this._pkgPath = process.cwd();

    this._prjPath = this._rootPath + Path.sep + "prj";
    ShellJS.mkdir(this._prjPath);
}

/**
 * Load web manifest.
 * @param {String} path Path to web manifest file
 */
Application.prototype.loadManifest =
function(path) {

    if (!ShellJS.test("-f", path)) {
        throw new Error("File not found: ", path);
    }

    this._manifest = new Manifest(this._output, path);
};

/**
 * Package identifier in reverse host format, i.e. com.example.foo.
 * @member {String} packageId
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "packageId", {
                      get: function() {
                                return this._packageId;
                           }
                      });

/**
 * Absolute path to directory where the html application is located.
 * @member {String} appPath
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "appPath", {
                      get: function() {
                                return this._appPath;
                            }
                      });

/**
 * Absolute path to directory where the build logfiles located.
 * @member {String} logPath
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "logPath", {
                      get: function() {
                                return this._logPath;
                            }
                      });

/**
 * Absolute path to directory where the built packaged need to be placed.
 * @member {String} pkgPath
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "pkgPath", {
                      get: function() {
                                return this._pkgPath;
                            }
                      });

/**
 * Absolute path to directory where the platform-specific project is located.
 * @member {String} prjPath
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "prjPath", {
                      get: function() {
                                return this._prjPath;
                            }
                      });

/**
 * Absolute path to the project's root directory.
 * @member {String} rootPath
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "rootPath", {
                      get: function() {
                                return this._rootPath;
                            }
                      });

/**
 * Absolute path to the generated package.
 * Ruturn null without successfully build.
 * @member {String} generatedPackage
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "generatedPackage", {
                      get: function() {
                                return this._generatedPackage;
                           },
                      set: function(packagePath) {
                                this._generatedPackage = packagePath;
                           }
                      });

/**
 * Read-only {@link Manifest} object.
 * @member {Manifest} manifest
 * @throws {IllegalAccessException} If writing this property is attempted.
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "manifest", {
                      get: function() {
                                return this._manifest;
                           },
                      set: function(unused) {
                                throw new IllegalAccessException("Attempting to write read-only property Application.manifest");
                           }
                      });

/**
 * Read-only {@link Config} object.
 * @member {Config} config
 * @throws {IllegalAccessException} If writing this property is attempted.
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "config", {
                      get: function() {
                                return require("./Config").getInstance();
                           },
                      set: function(config) {
                                throw new IllegalAccessException("Attempting to write read-only property Application.config");
                           }
                      });

/**
 * Read-only {@link LogfileOutput} object.
 * Setting this property to null will revert output to the default logfile.
 * @member {OutputIface} platformLogfileOutput
 * @throws {IllegalAccessException} If writing this property is attempted with anything else
 *                                  than a {@link LogfileOutput} or null.
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "platformLogfileOutput", {
                      get: function() {
                                return this._platformLogfileOutput;
                           },
                      set: function(platformLogfileOutput) {

                                if (platformLogfileOutput instanceof LogfileOutput) {

                                    // Route output to platform logfile.
                                    this._platformLogfileOutput = platformLogfileOutput;
                                    this.output.logfileOutput = platformLogfileOutput;

                                } else if (platformLogfileOutput === null) {

                                    // Reset output to common logfile.
                                    this._platformLogfileOutput = null;
                                    this.output.logfileOutput = this._logfileOutput;

                                } else {

                                    throw new IllegalAccessException("Attempting invalid write to property Application.platformLogfileOutput");
                                }
                           }
                      });

/**
 * Read-only {@link TerminalOutput} object.
 * @member {OutputIface} output
 * @throws {IllegalAccessException} If writing this property is attempted.
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "output", {
                      get: function() {
                                return this._output;
                           },
                      set: function(output) {
                                if (output instanceof OutputIface) {
                                    this._output = output;
                                } else {
                                    throw new IllegalAccessException("Application.output must implement OutputIface");
                                }
                           }
                      });

/**
 * Namespace for exceptions.
 * @member {Namespace} exceptions
 * @instance
 * @memberOf Application
 * @see Namespace {@link exceptions}
 */
Object.defineProperty(Application.prototype, "exceptions", {
                      get: function() {
                                return require("./util/exceptions.js");
                           }
                      });

/**
 * Namespace for utility classes.
 * @member {Namespace} util
 * @instance
 * @memberOf Application
 * @see Namespace {@link util}
 */
Object.defineProperty(Application.prototype, "util", {
                      get: function() {
                                return require("./util/index.js");
                           }
                      });

module.exports = Application;
