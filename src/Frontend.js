// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var ShellJS = require("shelljs");

var LogfileOutput = require("./LogfileOutput");

/**
 * Create a frontend instance, through which the respective platform backend
 * can interact with the application.
 * @constructor
 * @param {Application} application Application instance
 * @param {String} baseDir Base directory in which the project is located
 * @param {String} packageId Package identifier in reverse host format, i.e. com.example.foo
 * @param {String} platformId Platform identifier, all lowercase: android, ios, etc
 * @throws {Frontend~BackendInstantiationException} If instantiation failed
 */
function Frontend(application, baseDir, packageId, platformId) {

    this._application = application;
    this._packageId = packageId;
    this._platformId = platformId;

    if (!ShellJS.test("-d", baseDir) ||
        !Path.isAbsolute(baseDir)) {
        throw new BackendInstantiationException("Invalid base dir " + baseDir);
    }

    var projectDir = Path.join(baseDir, packageId);
    if (!ShellJS.test("-d", projectDir)) {
        throw new BackendInstantiationException("Invalid project dir " + projectDir);
    }

    this._appDir = Path.join(projectDir, "app");
    if (!ShellJS.test("-d", this._appDir)) {
        throw new BackendInstantiationException("Invalid application dir " + this._appDir);
    }

    this._platformDir = Path.join(projectDir, "platforms", platformId);
    if (!ShellJS.test("-d", this._platformDir)) {
        ShellJS.mkdir("-p", this._platformDir);
        if (!ShellJS.test("-d", this._platformDir)) {
            throw new BackendInstantiationException("Invalid platform dir " + this._platformDir);
        }
    }

    this._packageDir = Path.join(projectDir, "pkg");
    if (!ShellJS.test("-d", this._packageDir)) {
        throw new BackendInstantiationException("Invalid package dir " + this._packageDir);
    }

    var logfileDir = Path.join(projectDir, "log");
    if (!ShellJS.test("-d", logfileDir)) {
        throw new BackendInstantiationException("Invalid logfile dir " + logfileDir);
    }

    var logfilePath = Path.join(logfileDir, platformId + ".log");
    try {
        this._logfileOutput = new LogfileOutput(logfilePath);
    } catch (e) {
        throw new BackendInstantiationException("Failed to create logfile " + logfilePath);
    }
}

/**
 * Terminal output object.
 * @member {OutputIface} output
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "output", {
                      get: function() {
                                return this._application.output;
                           }
                      });

/**
 * Package identifier in reverse host format, i.e. com.example.foo.
 * @member {String} packageId
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "packageId", {
                      get: function() {
                                return this._packageId;
                           }
                      });

/**
 * Platform identifier, all lowercase: android, ios, etc.
 * @member {String} packageId
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "platformId", {
                      get: function() {
                                return this._platformId;
                           }
                      });

/**
 * Absolute path to directory where the html application is located.
 * @member {String} appDir
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "appDir", {
                      get: function() {
                                return this._appDir;
                            }
                      });

/**
 * Absolute path to directory where the platform-specific project is located.
 * @member {String} platformDir
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "platformDir", {
                      get: function() {
                                return this._platformDir;
                            }
                      });

/**
 * Absolute path to directory where the built packaged need to be placed.
 * @member {String} packageDir
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "packageDir", {
                      get: function() {
                                return this._packageDir;
                            }
                      });

/**
 * Logfile output object.
 * @member {OutputIface} logfileOutput
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "logfileOutput", {
                      get: function() {
                                return this._logfileOutput;
                            }
                      });

/**
 * Path where downloads are cached. Might be null when not used.
 * @member {String} downloadsCachePath
 * @instance
 * @memberOf Frontend
 */
Object.defineProperty(Frontend.prototype, "downloadsCachePath", {
                      get: function() {
                                return process.env.CROSSWALK_APP_TOOLS_DOWNLOAD_DIR;
                            }
                      });



/**
 * Creates a new BackendInstantiationException.
 * @extends Error
 * @constructor
 * @param {String} message Error message
 * @inner
 * @memberOf Frontend
 */
function BackendInstantiationException(message) {
    Error.call(this, message);
}
BackendInstantiationException.prototype = Error.prototype;

Frontend.prototype.BackendInstantiationException = BackendInstantiationException;

module.exports = Frontend;
