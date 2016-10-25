// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ChildProcess = require('child_process');
var Path = require("path");
var ShellJS = require("shelljs");

var AndroidTargets = require("./AndroidTargets");
var JavaActivity = require("./JavaActivity");



/**
 * Callback signature for {@link AndroidSDK.queryTarget}.
 * @param {String} apiTarget SDK API target identifier or null
 * @param {String} errmsg Error message or null
 * @inner
 * @memberOf AndroidSDK
 */
function queryTargetCb(apiTarget, errmsg) {}

/**
 * Callback signature for {@link AndroidSDK.generateProjectSkeleton}.
 * @param {String} path Path of project template or null
 * @param {String} logmsg Log message or null
 * @param {String} errmsg Error message or null
 * @inner
 * @memberOf AndroidSDK
 */
function generateProjectSkeletonCb(path, logmsg, errmsg) {}

/**
 * Callback signature for {@link AndroidSDK.buildProject}.
 * @param {Boolean} success Whether build succeeded
 * @inner
 * @memberOf AndroidSDK
 */
function buildProjectCb(success) {}



/**
 * Create AndroidSDK object, wrapping Android cmd-line tool interactions.
 * @constructor
 * @param {Application} application application instance
 * @throws {AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
 */
function AndroidSDK(application) {

    this._application = application;

    this._scriptPath = this.findAndroidScriptPath();
    if (this._scriptPath === null) {
        // TODO think out a way to unit test this code path.
        throw new SDKNotFoundError("Android SDK now found in environment search path.");
    }
}

/**
 * Filter known messages from stderr buffer
 * @param {String} buffer Input buffer
 * @returns {String} Filtered output buffer
 * @private
 */
AndroidSDK.prototype.filterErrorLog =
function(buffer) {

    var prefixes = [
        "Picked up _JAVA_OPTIONS",
        "Picked up JAVA_TOOL_OPTIONS" ];
    var filtered = "";
    var lines = buffer.toString().split("\n");
    for (var i = 0; i < lines.length; i++) {

        var line = lines[i].trim();
        if (line.length > 0) {

            var filter = false;
            for (var j = 0; j < prefixes.length; j++) {
                var prefix = prefixes[j];
                if (line.substring(0, prefix.length) === prefix) {
                    // skip
                    filter = true;
                    continue;
                }
            }

            if (!filter)
                filtered += line + "\n";
        }
    }

    return filtered;
};

/**
 * Query for lowest API target that supports apiLevel.
 * @param {Number} apiLevel Minimum supported API level
 * @param {AndroidSDK~queryTargetCb} callback callback function
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
 * Create project template by running "android create project".
 * @param {String} path Path where to create the project
 * @param {String} packageId Package name in the com.example.Foo format
 * @param {String} apiTarget Android API target android-xy as per "android list targets"
 * @param {AndroidSDK~generateProjectSkeletonCb} callback callback function
 */
AndroidSDK.prototype.generateProjectSkeleton =
function(path, packageId, apiTarget, callback) {

    var output = this._application.output;
    var errmsg = null;

    // Warn if path exists, but this is a valid case when building
    // 32- and 64-bit ABIs in one go.
    if (ShellJS.test("-e", path)) {
        output.warning("Project dir '" + path + "' already exists");
        callback(path, null, null);
        return;
    }

    var indicator = output.createInfiniteProgress("Creating " + packageId);

    // Create project
    // "android create project -t android-18 -p $(pwd)/Foo -k com.example.Foo -a MainActivity"
    var args = ["create", "project",
                "-t", apiTarget,
                "-p", path,
                "-k", packageId,
                "-a", "MainActivity"];
    var stdlog = null;
    var errlog = null;

    indicator.update("...");
    var child = ChildProcess.execFile(this._scriptPath, args, {},
                                      function(error, stdlog, errlog) {

        errmsg = this.filterErrorLog(errlog);
        if (error && error.message) {
            errmsg += error.message;
            indicator.done("error");
        } else {
            indicator.done();
        }

        // Delete stub activity, we extract the crosswalk one later on.
        var javaActivityPath = Path.join(JavaActivity.pathForPackage(path, packageId),
                                        "MainActivity.java");
        if (ShellJS.test("-f", javaActivityPath)) {
            ShellJS.rm("-f", javaActivityPath);
        } else {
            output.warning("File not found: " + javaActivityPath);
        }

        callback(path, stdlog, errmsg);
        return;
    }.bind(this));
};

/**
 * Build project by running "ant debug" or "ant release".
 * @param {Boolean} release Whether to build a release or debug package
 * @param {AndroidSDK~buildProjectCb} callback callback function
 */
AndroidSDK.prototype.buildProject =
function(release, callback) {

    var output = this._application.output;

    var ant = ShellJS.which("ant");
    if (!ant) {
        callback(null, "Executable 'ant' not found in path");
        return;
    }

    var exitStatus = { "code" : 0 };
    ant = "ant " + (release ? "release" : "debug");
    var child = ChildProcess.exec(ant);

    child.stdout.on("data", function(data) {

        // TODO write logfile?
        if (this.onData)
            this.onData(data);
    }.bind(this));

    child.stderr.on("data", function(data) {
        data = this.filterErrorLog(data);
        if (data) {
            output.warning(data, true);
        }
    }.bind(this));

    child.on("exit", function(code, signal) {
        callback(code === 0);
        return;
    });
};

AndroidSDK.prototype.onData =
function(data) {

};

/**
 * Try to find the "android" executable in the environment's search path.
 * @returns {String} Path or null.
 */
AndroidSDK.prototype.findAndroidScriptPath =
function() {

    return ShellJS.which("android");
};



/**
 * Creates a new SDKNotFoundError.
 * @extends Error
 * @constructor
 * @param {String} message Error message
 * @inner
 * @memberOf AndroidSDK
 */
function SDKNotFoundError(message) {
    Error.call(this, message);
}
SDKNotFoundError.prototype = Object.create(Error.prototype);
SDKNotFoundError.prototype.constructor = SDKNotFoundError;

AndroidSDK.prototype.SDKNotFoundError = SDKNotFoundError;



module.exports = AndroidSDK;
