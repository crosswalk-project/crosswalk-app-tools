// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ShellJS = require('shelljs');

/**
 * Construct a Config object.
 * @constructor
 */
function Config() {

    this._silentConsole = false;
    ShellJS.config.silent = true;
}

/**
 * Whether to log or suppress output.
 * @memberOf Config
 */
Config.prototype.getSilentConsole =
function() {

    return this._silentConsole;
};

/**
 * Whether to log or suppress output.
 * @memberOf Config
 */
Config.prototype.setSilentConsole =
function(silent) {

    this._silentConsole = silent;
};

module.exports = new Config();
