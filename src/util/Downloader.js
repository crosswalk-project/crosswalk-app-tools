// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Http = require("http");
var Https = require("https");
var Url = require("url");

var ShellJS = require("shelljs");



/**
 * Callback signature for {@link Downloader.get}
 * @memberOf Downloader
 * @inner
 */
function downloadFinishedCb(errormsg) {}



/**
 * Create Downloader object.
 * @constructor
 * @param {String} url URL to download.
 * @param {String} toPath Path do download to.
 * @throws {Downloader~FileCreationFailedError} If file toPath could not be opened.
 * @memberof util
 */
function Downloader(url, toPath) {

    this._url = url;

    if (ShellJS.test("-e", toPath)) {
        throw new FileCreationFailedError("File already exists " + toPath);
    }

    var options = {
        flags: "w",
        mode: 0600
    };
    this._fp = FS.createWriteStream(toPath, options);

    if (!this._fp) {
        throw new FileCreationFailedError("Could not open file " + toPath);
    }

    this._downloaded = 0;
    this._contentLength = 0;
}

/**
 * Download file.
 * @function get
 * @param {Function} callback see {@link Downloader~downloadFinishedCb}
 * @memberOf Downloader
 */
Downloader.prototype.get =
function(callback) {

    // Object can only be used once.
    if (!this._url) {
        callback("Invalid URL null");
        return;
    }

    // Object can only be used once.
    if (!this._fp) {
        callback("Downloader object can only be used once");
        return;
    }

    var getFunc;
    var urlInfo = Url.parse(this._url);
    if (urlInfo.protocol == "http:") {
        getFunc = Http.get;
    } else if (urlInfo.protocol == "https:") {
        getFunc = Https.get;
    } else {
        callback("Unsupported protocol " + urlInfo.protocol);
        return;
    }

    getFunc(urlInfo, function(res) {

        if (res.statusCode != 200) {
            callback("Download failed: HTTP Status " + res.statusCode);
            return;
        }

        this._contentLength = res.headers["content-length"];

        res.on("error", function(e) {

            this._fp.end();
            this._fp = null;
            this._url = null;
            callback("Download failed: " + e.message);

        }.bind(this));

        res.on('data', function(data) {

            this._fp.write(data);
            this._downloaded += data.length;
            this.progress(this._downloaded / this._contentLength);

        }.bind(this));

        res.on('end', function() {

            this._fp.end();
            this._fp = null;
            this._url = null;
            callback(null);

        }.bind(this));

    }.bind(this));
};

Downloader.prototype.progress =
function(progress) {

};



/**
 * Creates a new FileCreationFailedError.
 * @extends Error
 * @constructor
 * @param {String} message Error message.
 * @memberOf Downloader
 * @inner
 */
function FileCreationFailedError(message) {
    Error.call(this, message);
}
FileCreationFailedError.prototype = Error.prototype;

Downloader.FileCreationFailedError = FileCreationFailedError;



module.exports = Downloader;