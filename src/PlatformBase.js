// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require('path');

var Application = require("./Application");
var LogfileOutput = require("./LogfileOutput");

/**
 * Callback signature for {@link PlatformBase.generate}.
 * @param {String} errormsg null on success, otherwise error message
 * @inner
 * @memberOf PlatformBase
 */
function platformBaseOperationCb(result) {}

/**
 * @typedef PlatformData
 * @type {Object}
 * @property {Application} application Application instance
 * @property {String} platformId Name for backend (android, ios, ...)
 * @memberOf PlatformBase
 */

/**
 * Interface for platform implementations.
 * @constructor
 * @param {PlatformData} platformData Init data passed to the platform
 * @throws {Error} If instantiation failed.
 * @protected
 */
function PlatformBase(platformData) {

    if (platformData.application instanceof Application) {
        this._application = platformData.application;
    } else {
        throw new Error("PlatformBase() platformData.application not Application, but " + typeof platformData.application);
    }

    if (typeof platformData.platformId === "string" && platformData.platformId.length > 0) {
        this._platformId = platformData.platformId;
    } else {
        throw new Error("PlatformBase() invalid platformData.platformId '" + platformData.platformId + "'");
    }

    var logfilePath = Path.join(this._application.logPath, this._platformId + ".log");
    this._logOutput = new LogfileOutput(logfilePath);
}

/**
 * Application instance.
 * @member {Application} application
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "application", {
                      get: function() {
                                return this._application;
                           }
                      });

/**
 * Absolute path to directory where the html application is located.
 * @member {String} appPath
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "appPath", {
                      get: function() {
                                return this._application.appPath;
                            }
                      });

/**
 * Application instance.
 * @member {String} packageId
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "packageId", {
                      get: function() {
                                return this._application.packageId;
                           }
                      });

/**
 * Absolute path to directory where the platform-specific code is located (inside the project).
 * @member {String} platformPath
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "platformPath", {
                      get: function() {
                                return Path.join(this._application.prjPath, this.platformId);
                           }
                      });

/**
 * Absolute path to directory where the platform-specific project is located.
 * @member {String} prjPath
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "prjPath", {
                      get: function() {
                                return this._application.prjPath;
                            }
                      });

/**
 * Absolute path to directory where the built packaged need to be placed.
 * @member {String} pkgPath
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "pkgPath", {
                      get: function() {
                                return this._application.pkgPath;
                            }
                      });

/**
 * Platform identifier (android, ios, ...).
 * @member {String} platformId
 * @instance
 * @memberOf PlatformBase
 */
Object.defineProperty(PlatformBase.prototype, "platformId", {
                      get: function() {
                                return this._platformId;
                           }
                      });

/**
* Logfile output object.
* @member {OutputIface} logOutput
* @instance
* @memberOf PlatformBase
*/
Object.defineProperty(PlatformBase.prototype, "logOutput", {
                      get: function() {
                                return this._logOutput;
                      }
});

/**
 * Generate platform project template.
 * @param {Object} options Extra options for the command
 * @param {PlatformBase~platformBaseOperationCb} callback callback function
 */
PlatformBase.prototype.generate =
function(options, callback) {

    throw new Error("PlatformBase.generate() not implemented.");
};

/**
 * Update platform project to latest Crosswalk.
 */
PlatformBase.prototype.update =
function() {

    throw new Error("PlatformBase.update() not implemented.");
};

/**
 * Refresh platform project after environment changes.
 */
PlatformBase.prototype.refresh =
function() {

    throw new Error("PlatformBase.refresh() not implemented.");
};

/**
 * Build application package.
 * @param {String[]} abi Array of ABIs, supported armeabi-v7a, x86
 * @param {Boolean} release Whether to build debug or release package
 * @param {PlatformBase~platformBaseOperationCb} callback Callback function.
 */
PlatformBase.prototype.build =
function(abis, release, callback) {

    throw new Error("PlatformBase.build() not implemented.");
};

module.exports = PlatformBase;
