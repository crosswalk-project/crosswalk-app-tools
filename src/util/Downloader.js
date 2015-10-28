// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Http = require("http");
var Https = require("https");
var Url = require("url");

var HttpsProxyAgent = require("https-proxy-agent");
var ShellJS = require("shelljs");



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
 * @param {Stream} stream Stream to write data to
 */
function Downloader(url, stream) {

    this._url = url;
    this._stream = stream;

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
    if (!this._stream) {
        callback("Downloader object can only be used once");
        return;
    }

    var urlInfo = Url.parse(this._url);
    if (!urlInfo) {
        callback("Invalid URL " + this._url);
        return;
    }

    var proxyUrl = null;
    if (urlInfo.protocol == "http:" &&
        process.env.http_proxy) {

        // http GET via proxy.
        proxyUrl = process.env.http_proxy;
        if (proxyUrl.substring(0, "http:".length) != "http:" &&
            proxyUrl.substring(0, "https:".length) != "https:") {
            callback("Proxy URL is missing protocol portion (http: and https: are supported)");
            return;
        }
        var proxyInfo = Url.parse(proxyUrl);

        urlInfo.host = proxyInfo.hostname;
        delete urlInfo.href;
        delete urlInfo.pathname;
        urlInfo.port = proxyInfo.port;
        urlInfo.path = this._url;
        urlInfo.headers = { Host: urlInfo.hostname };
        delete urlInfo.hostname;

        this.httpGetImpl(urlInfo, callback);

    } else if (urlInfo.protocol == "https:" &&
               process.env.https_proxy) {

        // http GET via proxy.
        proxyUrl = process.env.https_proxy;
        if (proxyUrl.substring(0, "http:".length) != "http:" &&
            proxyUrl.substring(0, "https:".length) != "https:") {
            callback("Proxy URL is missing protocol portion (http: and https: are supported)");
            return;
        }

        var agent = new HttpsProxyAgent(proxyUrl);
        urlInfo.agent = agent;
        this.httpGetImpl(urlInfo, callback);

    } else {

        this.httpGetImpl(urlInfo, callback);
    }
};

Downloader.prototype.httpGetImpl =
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
            this._stream.end();
            this._stream = null;
            this._url = null;
            res.req.abort();
            callback("Download failed: HTTP Status " + res.statusCode);
            return;
        }

        this._contentLength = res.headers["content-length"] ?
                                    res.headers["content-length"] : -1;

        res.on("error", function(e) {

            this._stream.end();
            this._stream = null;
            this._url = null;
            callback("Download failed: " + e.message);

        }.bind(this));

        res.on('data', function(data) {

            this._stream.write(data);
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

            this._stream.on("finish", function() {
                // All data flushed.
                callback(null);
            });

            this._stream.end();
            this._stream = null;
            this._url = null;

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