// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Class that manages platform backends.
 * @constructor
 * @param {OutputIface} Output instance
 * @private
 */
function PlatformsManager(output) {

    this._output = output;
}

/**
 * @typedef PlatformInfo
 * @type {Object}
 * @property {Function} Ctor Constructor for the associated {@link PlatformBase} subclass
 * @property {String} platformId Name for backend (android, ios, ...)
 * @property {Object} argSpec Platform-specific command-line argument definitions
 * @memberOf PlatformsManager
 */

/**
 * Load default backend.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadDefault =
function() {

    var output = this._output;

    var implementations = [
        "crosswalk-app-tools-backend-ios",
        "crosswalk-app-tools-backend-deb",
        "crosswalk-app-tools-backend-demo",
        "crosswalk-app-tools-backend-test",
        "../android/index.js"
    ];

    var platformInfo = null;
    var warnings = [];

    for (var i = 0; i < implementations.length; i++) {

        try {

            var Ctor = require(implementations[i]);
            var prefix = "crosswalk-app-tools-backend-";
            var platformId = null;
            if (implementations[i].substring(0, prefix.length) == prefix) {
                // Extract last part after common prefix.
                platformId = implementations[i].substring(prefix.length);
            } else if (implementations[i] == "../android/index.js") {
                // Special case built-in android backend, so we get a conforming name.
                platformId = "android";
            } else {
                throw new Error("Unhandled platform name " + implementations[i]);
            }

            platformInfo = this.buildInfo(Ctor, platformId);

            // If we get here there backend has been instantiated successfully.
            break;

        } catch (e) {

            // Accumulate warnings, only emit them if no backend was found.
            warnings.push("Loading backend " + implementations[i] + " failed (" + e + ")");
        }
    }

    if (!platformInfo) {
        for (var j = 0; j < warnings.length; j++) {
            output.warning(warnings[j]);
        }
    }

    return platformInfo;
};

/**
 * Load platform by constructor.
 * @param {Function} PlatformImplCtor Constructor for a {@link PlatformBase} subclass
 * @param {String} platformId Identifier for platform (android, ios, ...)
 * @returns {PlatformInfo}
 * @protected
 */
PlatformsManager.prototype.buildInfo =
function(PlatformImplCtor, platformId) {

    var platformInfo = null;

    // Prefix all platform-specific args with the platform name
    var platformArgSpec = {};
    if (PlatformImplCtor.getArgs) {
        var argSpec = PlatformImplCtor.getArgs();
        for (var cmd in argSpec) {
            var cmdArgSpec = argSpec[cmd];
            var platformCmdArgSpec = {};
            for (var key in cmdArgSpec) {
                platformCmdArgSpec["--" + platformId + "-" + key] = cmdArgSpec[key];
            }
            platformArgSpec[cmd] = platformCmdArgSpec;
        }
    }

    platformInfo = {
        Ctor: PlatformImplCtor,
        platformId: platformId,
        argSpec: platformArgSpec
    };

    return platformInfo;
};

module.exports = PlatformsManager;
