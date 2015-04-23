// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require("path");

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var FileCreationFailed = require("./exceptions").FileCreationFailed;

/**
 * Create DownloadHandler object
 * @constructor
 * @param {String} path Path to download directory
 * @param {String} filename Name of file in download directory
 */
function DownloadHandler(path, filename) {

    this._path = path;
    this._filename = filename;
    this._tmpfile = null;
}

/**
 * Look in local search dirs for the file.
 * @param {String[]} localDirs Paths to search in
 * @returns {String} full path to file if found, or null.
 */
DownloadHandler.prototype.findLocally =
function(localDirs) {

    for (var i = 0; i < localDirs.length; i++) {
        var dir = localDirs[i];
        var path = Path.join(dir, this._filename);
        if (ShellJS.test("-f", path)) {
            return path;
        }
    }

    return null;
};

/**
 * Create stream for downloading.
 * @returns {fs.WriteStream} Stream to receive download
 * @throws {FileCreationFailed} If download file could not be written.
 */
DownloadHandler.prototype.createStream =
function() {

    if (this._tmpfile) {
        throw new exceptions.FileCreationFailed("Could not create stream, file exists " + this._tmpfile);
    }

    ShellJS.pushd(this._path);
    var tmpFileName = MkTemp.createFileSync("XXXXXX");
    ShellJS.popd();

    this._tmpfile = Path.join(this._path, tmpFileName);

    var options = {
        flags: "w",
        mode: 0600
    };
    var stream = FS.createWriteStream(this._tmpfile, options);
    if (!stream) {
        throw new exceptions.FileCreationFailed("Could not open file " + this._tmpfile);
    }

    return stream;
};

/**
 * Finish download, optionally copy file to downloads dir.
 * @param {String} [downloadsPath] If given, copy the downloaded file to this path.
 * @returns {String} Path to downloaded file.
 * @throws {FileCreationFailed} If download file could not be written.
 */
DownloadHandler.prototype.finish =
function(downloadsPath) {

    if (!ShellJS.test("-f", this._tmpfile)) {
        throw new exceptions.FileCreationFailed("Invalid download " + this._tmpfile);
    }

    var finishedPath = Path.join(this._path, this._filename);
    if (ShellJS.test("-f", finishedPath)) {
        throw new exceptions.FileCreationFailed("File already exists " + finishedPath);
    }

    ShellJS.mv(this._tmpfile, finishedPath);
    this._tmpfile = null;

    // Copy to downloads dir if given
    if (downloadsPath &&
        ShellJS.test("-d", downloadsPath)) {
        ShellJS.cp(finishedPath, downloadsPath);
    }

    return finishedPath;
};

module.exports = DownloadHandler;
