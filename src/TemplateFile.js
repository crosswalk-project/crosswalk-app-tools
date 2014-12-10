// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Mustache = require("mustache");

var Config = require("./Config");

/**
 * Class to handle reading and writing template files.
 * @param {String} path Path to template file.
 * @throws {Error} When file could not be read.
 * @constructor
 */
function TemplateFile(path) {

    this._buffer = FS.readFileSync(path, {"encoding": "utf8"});
    if (!this._buffer || this._buffer.length === 0) {
        throw new Error("Could not read " + path);
    }
}

/**
 * Render template file to output file.
 * @function render
 * @param {Object} data Data according to Mustache docs.
 * @param {String} path Path to output file.
 * @returns {Error} when failed, null on success.
 * @memberOf TemplateFile
 */
TemplateFile.prototype.render = function(data, path) {

    var output = Mustache.render(this._buffer, data);
    return FS.writeFileSync(path, output);
};

module.exports = TemplateFile;
