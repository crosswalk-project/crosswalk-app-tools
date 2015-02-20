// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Http = require("http");
var Https = require("https");
var Url = require("url");

var ShellJS = require("shelljs");

var FileCreationFailed = require("./exceptions").FileCreationFailed;



/**
 * Callback signature for {@link Downloader.get}.
 * @param {String} errormsg Error or null upon success
 * @inner
 * @memberOf Downloader
 */
function downloadFinishedCb(errormsg) {}



/**
 * Create Downloader object.
 * @constructor
 * @param {String} url URL to download
 * @param {String} toPath Path do download to
 * @throws {exceptions.FileCreationFailed} If file toPath could not be opened for writing.
 */
function Downloader(url, toPath) {

    this._url = url;

    if (ShellJS.test("-e", toPath)) {
        throw new FileCreationFailed("File already exists " + toPath);
    }

    var options = {
        flags: "w",
        mode: 0600
    };
    this._fp = FS.createWriteStream(toPath, options);

    if (!this._fp) {
        throw new FileCreationFailed("Could not open file " + toPath);
    }

    this._downloaded = 0;
    this._contentLength = 0;
}

/**
 * Download file.
 * @param {Downloader~downloadFinishedCb} callback callback function
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

    var urlInfo = Url.parse(this._url);
    if (!urlInfo) {
        callback("Invalid URL " + this._url);
        return;
    }

    if (urlInfo.protocol == "http:" &&
        process.env.http_proxy) {

        // This is a bit of a hack to get the proxy name:port into a
        // format that the url parser can digest.
        var proxyInfo = Url.parse("http://" + process.env.http_proxy);

        urlInfo.host = proxyInfo.hostname;
        delete urlInfo.href;
        delete urlInfo.pathname;
        urlInfo.port = proxyInfo.port;
        urlInfo.path = this._url;
        urlInfo.headers = { Host: urlInfo.hostname };
        delete urlInfo.hostname;

        this.getDefaultImpl(urlInfo, callback);

    } else if (urlInfo.protocol == "https:" &&
               process.env.https_proxy) {

        // this.getHttpsProxyImpl(urlInfo, callback);
        callback("HTTPS proxy not implemented");
        return;

    } else {

        this.getDefaultImpl(urlInfo, callback);
    }
};

Downloader.prototype.getDefaultImpl =
function(urlInfo, callback) {

    var getFunc;
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

        this._contentLength = res.headers["content-length"] ?
                                    res.headers["content-length"] : -1;

        res.on("error", function(e) {

            this._fp.end();
            this._fp = null;
            this._url = null;
            callback("Download failed: " + e.message);

        }.bind(this));

        res.on('data', function(data) {

            this._fp.write(data);
            this._downloaded += data.length;

            if (this._contentLength < 0) {
                // Unknown content length, just fire progress 0.5 for good measure.
                this.progress(0.5);
            } else {
                this.progress(this._downloaded / this._contentLength);
            }

        }.bind(this));

        res.on('end', function() {

            if (this._contentLength < 0) {
                // Unknown content length, just fire progress 1.0 (done) for good measure.
                this.progress(1.0);
            }

            this._fp.end();
            this._fp = null;
            this._url = null;
            callback(null);

        }.bind(this));

    }.bind(this));
};

Downloader.prototype.getHttpsProxyImpl =
function(callback) {

};

Downloader.prototype.progress =
function(progress) {

};



module.exports = Downloader;