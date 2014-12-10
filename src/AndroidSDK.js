// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ChildProcess = require('child_process');
var Path = require("path");
var ShellJS = require("shelljs");

var AndroidTargets = require("./AndroidTargets");
var Config = require("./Config");
var Console = require("./Console");



/**
 * Callback signature for {@link AndroidSDK.queryTarget}
 * @param {String} apiTarget SDK API target identifier or null.
 * @param {String} errmsg Error message or null.
 * @memberOf AndroidSDK
 * @inner
 */
function queryTargetCb(apiTarget, errmsg) {}

/**
 * Callback signature for {@link AndroidSDK.generateProjectSkeleton}
 * @param {String} path Path of project template or null.
 * @param {String} logmsg Log message or null.
 * @param {String} errmsg Error message or null.
 * @memberOf AndroidSDK
 * @inner
 */
function generateProjectSkeletonCb(path, logmsg, errmsg) {}

/**
 * Callback signature for {@link AndroidSDK.buildProject}
 * @param {Boolean} success Whether build succeeded.
 * @memberOf AndroidSDK
 * @inner
 */
function buildProjectCb(success) {}

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
        return;
    }

    var child = ChildProcess.execFile(this._scriptPath, ["list", "target"], {},
                                      function(errmsg, stdlog, errlog) {

        var apiTarget = null;
        if (stdlog !== null) {

            try {
                var targets = new AndroidTargets(stdlog);
                apiTarget = targets.pickLowest(apiLevel);
            } catch (e) {
                errmsg = "Failed to parse SDK API targets.";
            }

        } else if (errmsg === null) {
            errmsg = "No SDK API targets found";
        }

        callback(apiTarget, errmsg);
    }.bind(this));
};

/**
 * Create project template by running "android create project ..."
 * @function generateProjectSkeleton
 * @param {String} packageId Package name in the com.example.Foo format.
 * @param {String} apiTarget Android API target android-xy as per "android list targets".
 * @param {Function} callback see {@link AndroidSDK~generateProjectSkeletonCb}
 * @returns null
 * @memberOf AndroidSDK
 */
AndroidSDK.prototype.generateProjectSkeleton =
function(packageId, apiTarget, callback) {

    var errmsg = null;

    // Construct path and fail if exists.
    var wd = ShellJS.pwd();
    var path = wd + Path.sep + packageId;
    if (ShellJS.test("-e", path)) {
        errmsg = "Error: project dir '" + path + "' already exists";
        Console.error(errmsg);
        callback(null, null, errmsg);
        return;
    }

    // Create project
    // "android create project -t android-18 -p $(pwd)/Foo -k com.example.Foo -a MainActivity"
    var args = ["create", "project",
                "-t", apiTarget,
                "-p", path,
                "-k", packageId,
                "-a", "MainActivity"];
    var stdlog = null;
    var errlog = null;
    var child = ChildProcess.execFile(this._scriptPath, args, {},
                                      function(errmsg, stdlog, errlog) {

        if (errlog && !errmsg) {
            // Pass back errlog output as error message.
            errmsg = errlog;
        }

        callback(path, stdlog, errmsg);
        return;
    });
};

AndroidSDK.prototype.refreshProject =
function() {

    // TODO
};

/**
 * Build project by running "ant debug" or "ant release"
 * @function buildProject
 * @param {Boolean} release Whether to build a release or debug package.
 * @param {Function} callback see {@link AndroidSDK~buildProjectCb}
 * @returns null
 * @memberOf AndroidSDK
 */
AndroidSDK.prototype.buildProject =
function(release, callback) {

    var ant = ShellJS.which("ant");
    if (!ant) {
        callback(null, "Executable 'ant' not found in path");
        return;
    }

    var exitStatus = { "code" : 0 };
    var args = [ release ? "release" : "debug" ];
    var child = ChildProcess.execFile(ant, args);

    child.stdout.on("data", function(data) {
        Console.put(data);
    });

    child.stderr.on("data", function(data) {
        Console.put(data, true);
    });

    child.on("exit", function(code, signal) {
        callback(code === 0);
        return;
    });
};

/**
 * Try to find the "android" executable in the environment's search path.
 * @function findAndroidScriptPath
 * @returns {String} Path or null.
 * @memberOf AndroidSDK
 */
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
