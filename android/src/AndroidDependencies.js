// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require("path");

var MemoryStream = require("memorystream");
var ShellJS = require("shelljs");

var Downloader = require("../../src/util/Downloader");
var FileCreationFailed = require("../../src/util/exceptions").FileCreationFailed;
var IndexParser = require("../../src/util/IndexParser");

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

    var output = this._application.output;
    var url = BASE_URL + this._channel + "/";

    // Download
    var stream = new MemoryStream();
    var buffer = "";
    stream.on("data", function(data) {
        buffer += data.toString();
    });

    var downloader = new Downloader(url, stream);

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
            var parser = new IndexParser(buffer);
            var versions = parser.parse();
            callback(versions);
        }
    });
};

/**
 * Pick latest version from array of version strings.
 * @param {String[]} versions Array of version strings
 * @returns {String} Latest version or null on error.
 */
AndroidDependencies.prototype.pickLatest =
function(versions) {

    var output = this._application.output;

    if (!(versions instanceof Array) ||
        versions.length === 0) {

        output.error("No available Crosswalk versions found");
        return null;
    }

    var zero = [0, 0, 0, 0];
    var latest = zero;
    for (var i = 0; i < versions.length; i++) {

        // Split up version string.
        var v = versions[i].split(".");
        if (v.length != 4) {
            output.error("Invalid Crosswalk version " + versions[i]);
            return null;
        }

        // Check against latest remembered version.
        var j = 0;
        for (j = 0; j < 4; j++) {
            if (v[j] > latest[j]) {
                // Tested version is greater than what we have.
                latest = v;
                break;
            }
        }
    }

    // Make sure we found a version, return null otherwise.
    return latest != zero ? latest.join(".") : null;
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
 * Download crosswalk zip.
 * @param {String} version Crosswalk version string
 * @param {String} dir Directory to download to
 * @param {AndroidDependencies~downloadFinishedCb} callback callback function
 * @throws {FileCreationFailed} If download file could not be written.
 */
AndroidDependencies.prototype.download =
function(version, dir, callback) {

    var output = this._application.output;
    var filename = "crosswalk-" + version + ".zip";
    var url = BASE_URL +
              this._channel + "/" +
              version + "/" +
              filename;

    var downloadPath = Path.join(dir, filename);
    var cacheDir = null;
    if (process.env.CROSSWALK_APP_TOOLS_CACHE_DIR &&
        ShellJS.test("-d", process.env.CROSSWALK_APP_TOOLS_CACHE_DIR)) {

        cacheDir = process.env.CROSSWALK_APP_TOOLS_CACHE_DIR;
        cacheFile = Path.join(cacheDir, filename);
        if (ShellJS.test("-f", cacheFile)) {
            // Copy to requested download dir and report finished
            if (downloadPath != cacheFile) {
                ShellJS.cp("-f", cacheFile, downloadPath);
            }
            output.info("Using cached " + cacheFile);
            callback(downloadPath);
            return;
        }
    }

    // Download
    // At the moment we unconditionally download, overwriting the existing copy.
    var label = "Downloading '" + this._channel + "' " + version;
    var indicator = output.createFiniteProgress(label);

    var options = {
        flags: "w",
        mode: 0600
    };
    var stream = FS.createWriteStream(downloadPath, options);
    if (!stream) {
        throw new FileCreationFailed("Could not open file " + downloadPath);
    }

    var downloader = new Downloader(url, stream);
    downloader.progress = function(progress) {
        indicator.update(progress);
    };
    downloader.get(function(errormsg) {

        indicator.done("");

        if (errormsg) {

            callback(null, errormsg);

        } else {

            // Store file to cache
            if (cacheDir) {
                output.info("Storing download in " + cacheDir);
                ShellJS.cp("-f", downloadPath, cacheDir);
            }
            callback(downloadPath);
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
