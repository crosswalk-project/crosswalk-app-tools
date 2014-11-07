// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Console output interface.
 * @constructor
 * @protected
 */
function ConsoleIface() {}

/**
 * Log error message.
 * @param {String} message
 * @memberOf ConsoleIface
 */
ConsoleIface.prototype.error =
function(message) {

    throw new Error("ConsoleIface.error() not implemented.");
};

/**
 * Log warning message.
 * @param {String} message
 * @memberOf ConsoleIface
 */
ConsoleIface.prototype.warning =
function(message) {

    throw new Error("ConsoleIface.warning() not implemented.");
};

/**
 * Log message.
 * @param {String} message
 * @memberOf ConsoleIface
 */
ConsoleIface.prototype.log =
function(message) {

    throw new Error("ConsoleIface.log() not implemented.");
};

module.exports = ConsoleIface;