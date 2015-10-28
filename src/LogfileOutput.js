// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var FileCreationFailed = require("./util/exceptions").FileCreationFailed;
var OutputIface = require("./OutputIface");



/**
 * Creates an output writing to a file.
 * @extends OutputIface
 * @constructor
 * @param {String} path Path to logfile. Existing content will be overwritten.
 * @throws {exceptions.FileCreationFailed} If file at path could not be opened for writing.
 */
function LogfileOutput(path) {

    this._path = path;

    var options = {
        flags: "w",
        mode: 0600
    };

    FS.writeFileSync(this._path, "");

/* TODO
    if (!this._fp) {
        throw new FileCreationFailed("Could not open file " + path);
    }
*/
}
LogfileOutput.prototype = Object.create(OutputIface.prototype);
LogfileOutput.prototype.constructor = LogfileOutput;

LogfileOutput.prototype.error =
function(message) {

    var output = "*** ERROR: " + message + "\n";
    FS.appendFileSync(this._path, output);
    return output;
};

LogfileOutput.prototype.warning =
function(message) {

    var output = " ** WARNING: " + message + "\n";
    FS.appendFileSync(this._path, output);
    return output;
};

LogfileOutput.prototype.info =
function(message, path) {

    var output;
    if (path) {
        output = "  * " + message + " " + path + "\n";
    } else {
        output = "  * " + message + "\n";
    }
    FS.appendFileSync(this._path, output);
    return output;
};

LogfileOutput.prototype.highlight =
function(message) {

    var output = "    >> " + message + " <<\n";
    FS.appendFileSync(this._path, output);
    return output;
};

LogfileOutput.prototype.write =
function(message) {

    FS.appendFileSync(this._path, message);
    return message;
};

LogfileOutput.prototype.verbose =
function(message) {

    FS.appendFileSync(this._path, message);
    return message;
};



module.exports = LogfileOutput;
