// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var AndroidTargets = require("../src/AndroidTargets");
var ShellJS = require("shelljs");

/**
 * Create AndroidSDK object, wrapping Android cmd-line tool interactions.
 * @throws {SDKNotFoundError} If the Android SDK was not found in the environment.
 * @constructor
 */
function AndroidSDK() {

    this._scriptPath = this.findAndroidScriptPath();
    if (this._scriptPath === null) {
        // TODO think out a way to unit test this code path.
        throw new SDKNotFoundError("Android SDK now found in environment search path.");
    }
}

/**
 * Query for lowest API target that supports apiLevel.
 * @param {Number} apiLevel Minimum supported API level.
 * @param {Function} callback Callback function(target, errormsg), (String, String)
 * @returns null
 * @memberOf AndroidSDK
 */
AndroidSDK.prototype.queryTarget = function(apiLevel, callback) {

    if (this.buffer === null) {
        callback([], "Android SDK executable not found");
    }

    var execFile = require('child_process').execFile;
    var child = execFile(this._scriptPath, ["list", "target"], {}, function(error, stdout, stderr) {

        var target = null;
        if (stdout !== null) {

            try {
                var targets = new AndroidTargets(stdout);
                target = targets.pickLowest(apiLevel);
            } catch (e) {
                error = "Failed to parse SDK targets.";
            }

        } else if (error === null) {
            error = "No SDK targets found";
        }

        callback(target, error);
    }.bind(this));

    // Shut up lint
    return null;
};

AndroidSDK.prototype.generateProject = function() {

    // TODO
};

AndroidSDK.prototype.refreshProject = function() {

    // TODO
};

AndroidSDK.prototype.buildProject = function() {

    // TODO
};

AndroidSDK.prototype.findAndroidScriptPath = function() {

    return ShellJS.which("android");
};



/**
 * Creates a new SDKNotFoundError.
 * @param {String} message Error message.
 * @constructor
 */
function SDKNotFoundError(message) {
    Error.call(this, message);
}
SDKNotFoundError.prototype = Error.prototype;

AndroidSDK.SDKNotFoundError = SDKNotFoundError;


module.exports = AndroidSDK;
