// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var PlatformBase = require("./PlatformBase");

/**
 * Encapsulates static backend information, does not depend on an instance.
 * @param {Function} PlatformCtor Constructor function for the platform
 * @param {String} platformId Name for the platform, "android", "ios", ...
 * @constructor
 */
function PlatformInfo(PlatformCtor, platformId) {

    this._Ctor = PlatformCtor;
    this._platformId = platformId;

    // Prefix all platform-specific args with the platform name
    var argSpec = PlatformCtor.getArgs ? PlatformCtor.getArgs() : {};
    this._argSpec = {};
    for (var cmd in argSpec) {
        var cmdArgSpec = argSpec[cmd];
        var platformCmdArgSpec = {};
        for (var key in cmdArgSpec) {
            platformCmdArgSpec["--" + platformId + "-" + key] = cmdArgSpec[key];
        }
        this._argSpec[cmd] = platformCmdArgSpec;
    }

    // Look for platforms env vars
    this._envSpec = PlatformCtor.getEnv ? PlatformCtor.getEnv() : {};
}

/**
 * Platform identifier, e.g. "android", "ios", ...
 * @member {String} platformId
 * @instance
 * @memberOf PlatformInfo
 */
Object.defineProperty(PlatformInfo.prototype, "platformId", {
                      get: function() {
                                return this._platformId;
                           }
                      });

/**
 * Extra arguments definition for the platform
 * @member {Object} argSpec
 * @instance
 * @memberOf PlatformInfo
 */
Object.defineProperty(PlatformInfo.prototype, "argSpec", {
                      get: function() {
                                return this._argSpec;
                           }
                      });

/**
 * Extra environment variables influencing platform behaviour
 * @member {Object} envSpec
 * @instance
 * @memberOf PlatformInfo
 */
Object.defineProperty(PlatformInfo.prototype, "envSpec", {
                      get: function() {
                                return this._envSpec;
                           }
                      });

/**
 * Module constructor.
 * @member {Function} Ctor
 * @instance
 * @memberOf PlatformInfo
 */
Object.defineProperty(PlatformInfo.prototype, "Ctor", {
                      get: function() {
                                return this._Ctor;
                           }
                      });

/**
 * Instantiate platform backend.
 * @param {Application} application Application instance
 * @returns {PlatformBase} subclass implementing the actual platform, or null on error
 */
PlatformInfo.prototype.create =
function(application) {

    // See type PlatformData
    var platformData = {
        application: application,
        platformId: this._platformId,
        argSpec: this._argSpec
    };

    var platform = null;
    try {
        platform = new this._Ctor(PlatformBase, platformData);
    } catch (e) {
        application.output.error("Failed to load '" + this._platformId + "' platform backend");
    }

    return platform;
};

/**
 * Filter arguments for backend-specific ones, and collect them for
 * invocations into the backend.
 * @param {Object} allArgs Global arg object
 * @returns {Object} Args for the backend, with prefixes removed.
 */
PlatformInfo.prototype.collectArgs =
function(allArgs) {

    // Collect backend-specific args
    var args = {};
    for (var key in this._argsSpec) {
        // Strip dash prefix before matching, Minimist strips them also.
        var key_ = key.substring("--".length);
        if (allArgs && allArgs[key_]) {
            // Also strip platform prefix before collecting the arg.
            var argPrefix = this._platformId + "-";
            var argName = key_.substring(argPrefix.length);
            args[argName] = allArgs[key_];
        }
    }

    return args;
};

module.exports = PlatformInfo;
