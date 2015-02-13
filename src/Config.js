// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ShellJS = require('shelljs');

/**
 * Construct a {Config} object.
 * @constructor
 * @private
 */
function Config() {

    if (!Config._instance) {
        Config._instance = this;
        this._silentConsole = false;
        ShellJS.config.silent = true;
    }

    return Config._instance;
}

/**
 * Whether to log or suppress output.
 * @returns {Boolean} Whether output is suppressed
 */
Config.prototype.getSilentConsole =
function() {

    return this._silentConsole;
};

/**
 * Whether to log or suppress output.
 * @param {Boolean} silent Do not print output
 */
Config.prototype.setSilentConsole =
function(silent) {

    this._silentConsole = silent;
};

/**
 * Retrieve singleton instance.
 * @function getInstance
 * @returns {Config} Singleton instance.
 * @memberOf Config
 */
function getInstance() {

    return new Config();
}

module.exports = {
    class: Config,
    getInstance: getInstance
};
