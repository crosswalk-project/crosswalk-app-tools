// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require("path");

var MemoryStream = require("memorystream");
var ShellJS = require("shelljs");

var BASE_URL = "https://download.01.org/crosswalk/releases/crosswalk/android/";

// Channels are in preferred search order.
var CHANNELS = ["stable", "beta", "canary"];



/**
 * Callback signature for {@link AndroidDependencies.fetchVersions}
 * @param {String[]} versions Array of available Crosswalk versions sorted oldest - newest
 * @param {String} errormsg Message in case of Error
 * @inner
 * @memberOf AndroidDependencies
 */
function fetchVersionsFinishedCb(versions, errormsg) {}

/**
 * Callback signature for {@link AndroidDependencies.download}.
 * @param {String} path Path to downloaded file, or null on error
 * @param {String} errormsg null if success, otherwise error message
 * @inner
 * @memberOf AndroidDependencies
 */
function downloadFinishedCb(path, errormsg) {}



/**
 * Android project dependencies download and lookup.
 * @constructor
 * @param {Application} application application instance
 * @param {String} channel Crosswalk channel beta/canary/stable
 * @throws {AndroidDependencies~InvalidChannelError} If no valid channel was specified.
 */
function AndroidDependencies(application, channel) {

    this._application = application;

    if (CHANNELS.indexOf(channel) == -1) {
        throw new InvalidChannelError("Unknown channel " + channel);
    }

    this._channel = channel;
}

/**
 * Read-only array of valid release channels (stable, beta, canary).
 * @member {String[]} CHANNELS
 * @static
 * @memberOf AndroidDependencies
 */
Object.defineProperty(AndroidDependencies, "CHANNELS", {
                      get: function() {
                                return CHANNELS;
                           },
                      set: function(config) {
                                // Empty because read-only
                           }
                      });

/**
 * Fetch available Crosswalk versions index.
 * @param {AndroidDependencies~fetchVersionsFinishedCb} callback callback function
 */
AndroidDependencies.prototype.fetchVersions =
function(callback) {

    // Namespace util
    var util = this._application.util;
    var output = this._application.output;
    var url = BASE_URL + this._channel + "/";

    // Download
    var stream = new MemoryStream();
    var buffer = "";
    stream.on("data", function(data) {
        buffer += data.toString();
    });

    // Namespace util
    var downloader = new util.Downloader(url, stream);

    var label = "Fetching '" + this._channel + "' versions index";
    var indicator = output.createFiniteProgress(label);
    downloader.progress = function(progress) {
        indicator.update(progress);
    };

    downloader.get(function(errormsg) {

        indicator.done("");

        if (errormsg) {

            callback(null, errormsg);

        } else {

            // Parse
            var parser = new util.IndexParser(buffer);
            var versions = parser.parse();
            callback(versions);
        }
    });
};

/**
 * Locate Crosswalk distribution zip.
 * @param {String} version Crosswalk version to look for
 * @returns {String} Relative path to zip file.
 */
AndroidDependencies.prototype.findLocally =
function(version) {

    var filename = "crosswalk-" + version + ".zip";
    if (ShellJS.test("-f", filename))  {
        return filename;
    } else if (ShellJS.test("-f", "../" + filename)) {
        // Also try parent dir.
        // This is especially useful for tests that run in a temporary dir.
        return "../" + filename;
    }

    return null;
};

/**
 * Download crosswalk zip, checks for already existing file, and returns it in case.
 * @param {String} version Crosswalk version string
 * @param {String} defaultPath Directory to download to if not already exists
 * @param {AndroidDependencies~downloadFinishedCb} callback callback function
 * @throws {FileCreationFailed} If download file could not be written.
 */
AndroidDependencies.prototype.download =
function(version, defaultPath, callback) {

    // Namespaces
    var exceptions = this._application.exceptions;
    var util = this._application.util;

    var output = this._application.output;
    var filename = "crosswalk-" + version + ".zip";
    var url = BASE_URL +
              this._channel + "/" +
              version + "/" +
              filename;

    // Check for existing download in defaultPath, parent dir, and cache dir if set
    var handler = new util.DownloadHandler(defaultPath, filename);
    var localDirs = [defaultPath, ""];
    if (process.env.CROSSWALK_APP_TOOLS_CACHE_DIR)
        localDirs.push(process.env.CROSSWALK_APP_TOOLS_CACHE_DIR);
    var localPath = handler.findLocally(localDirs);
    if (localPath) {
        output.info("Using cached " + localPath);
        callback(localPath);
        return;
    }

    // Download
    var label = "Downloading '" + this._channel + "' " + version;
    var indicator = output.createFiniteProgress(label);

    var stream = handler.createStream();
    var downloader = new util.Downloader(url, stream);
    downloader.progress = function(progress) {
        indicator.update(progress);
    };
    downloader.get(function(errormsg) {

        indicator.done("");

        if (errormsg) {

            callback(null, errormsg);

        } else {

            var finishedPath = handler.finish(process.env.CROSSWALK_APP_TOOLS_CACHE_DIR);
            callback(finishedPath);
        }
    });
};



/**
 * Creates a new InvalidChannelError.
 * @extends Error
 * @constructor
 * @param {String} message Error message
 * @inner
 * @memberOf AndroidDependencies
 */
function InvalidChannelError(message) {
    Error.call(this, message);
}
InvalidChannelError.prototype = Error.prototype;

AndroidDependencies.prototype.InvalidChannelError = InvalidChannelError;



module.exports = AndroidDependencies;
