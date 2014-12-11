// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

/**
 * Constructor of Tmpdir object.
 * @constructor
 */
function Tmpdir() {
    
}

/**
 * Run code in a temporary directory.
 * The directory is deleted after completion of the callback.
 * @function run
 * @param {String} template Template string for the temporary directory
 * @callback {Function} callback Function that is run under the temporary dir.
 * @returns {Boolean} true on success, false on failure.
 * @memberOf Tmpdir
 */
Tmpdir.prototype.run =
function(template, callback) {

    // TODO better check for errors
    var wd = process.cwd();
    var dir = MkTemp.createDirSync(template);
    if (!dir) {
        return false;
    }

    process.chdir(dir);

    callback();

    process.chdir(wd);
    ShellJS.rm("-rf", dir);

    return true;
};

module.exports = new Tmpdir();
