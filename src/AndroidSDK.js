// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ChildProcess = require('child_process');
var Path = require("path");
var AndroidTargets = require("../src/AndroidTargets");
var Console = require("../src/Console");
var ShellJS = require("shelljs");



/**
 * Callback signature for {@link AndroidSDK.queryTarget}
 * @param {String} apiTarget SDK API target identifier or null.
 * @param {String} errormsg Error message or null.
 * @memberOf AndroidSDK
 * @inner
 */
function queryTargetCb(apiTarget, errormsg) {}

/**
 * Callback signature for {@link AndroidSDK.generateProjectTemplate}
 * @param {String} path Path of project template or null.
 * @param {String} logmsg Log message or null.
 * @param {String} errormsg Error message or null.
 * @memberOf AndroidSDK
 * @inner
 */
function generateProjectTemplateCb(path, logmsg, errormsg) {}



/**
 * Create AndroidSDK object, wrapping Android cmd-line tool interactions.
 * @throws {AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
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
 * @function queryTarget
 * @param {Number} apiLevel Minimum supported API level.
 * @param {Function} callback see {@link AndroidSDK~queryTargetCb}
 * @returns null
 * @memberOf AndroidSDK
 */
AndroidSDK.prototype.queryTarget =
function(apiLevel, callback) {

    if (this.buffer === null) {
        callback([], "Android SDK executable not found");
    }

    var child = ChildProcess.execFile(this._scriptPath, ["list", "target"], {},
                                      function(error, stdout, stderr) {

        var apiTarget = null;
        if (stdout !== null) {

            try {
                var targets = new AndroidTargets(stdout);
                apiTarget = targets.pickLowest(apiLevel);
            } catch (e) {
                error = "Failed to parse SDK API targets.";
            }

        } else if (error === null) {
            error = "No SDK API targets found";
        }

        callback(apiTarget, error);
    }.bind(this));

    // Shut up lint
    return null;
};

/**
 * Create project template by calling "android create project ..."
 * @function generateProjectTemplate
 * @param {String} packageId Package name in the com.example.Foo format.
 * @param {String} apiTarget Android API target android-xy as per "android list targets".
 * @param {Function} callback see {@link AndroidSDK~generateProjectTemplateCb}
 * @returns null
 * @memberOf AndroidSDK
 */
AndroidSDK.prototype.generateProjectTemplate =
function(packageId, apiTarget, callback) {

    var errormsg = null;

    // Construct path and fail if exists.
    var pwd = ShellJS.pwd();
    var path = pwd + Path.sep + packageId;
    if (ShellJS.test("-e", path)) {
        errormsg = "Error: project dir '" + path + "' already exists";
        Console.error(errormsg);
        callback(null, null, errormsg);
    }

    // Create project
    // "android create project -t android-18 -p $(pwd)/Foo -k com.example.Foo -a MainActivity"
    var args = ["create", "project",
                "-t", apiTarget,
                "-p", path,
                "-k", packageId,
                "-a", "MainActivity"];
    var stdout = null;
    var stderr = null;
    var child = ChildProcess.execFile(this._scriptPath, args, {},
                                      function(errormsg, stdout, stderr) {

        if (stderr && !errormsg) {
            // Pass back stderr output as error message.
            errormsg = stderr;
        }

        callback(path, stdout, errormsg);
    });


    // Shut up lint
    return null;
};

AndroidSDK.prototype.refreshProject =
function() {

    // TODO
};

AndroidSDK.prototype.buildProject =
function() {

    // TODO
};

AndroidSDK.prototype.findAndroidScriptPath =
function() {

    return ShellJS.which("android");
};



/**
 * Creates a new SDKNotFoundError.
 * @extends Error
 * @param {String} message Error message.
 * @constructor
 * @memberOf AndroidSDK
 * @inner
 */
function SDKNotFoundError(message) {
    Error.call(this, message);
}
SDKNotFoundError.prototype = Error.prototype;

AndroidSDK.SDKNotFoundError = SDKNotFoundError;



module.exports = AndroidSDK;
