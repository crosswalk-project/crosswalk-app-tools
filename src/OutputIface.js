// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Console output interface.
 * @constructor
 * @protected
 */
function OutputIface() {}

/**
 * Log error message.
 * @param {String} message
 */
OutputIface.prototype.error =
function(message) {

    throw new Error("ConsoleIface.error() not implemented.");
};

/**
 * Log message.
 * @param {String} message
 */
OutputIface.prototype.log =
function(message) {

    throw new Error("ConsoleIface.log() not implemented.");
};

/**
 * Highlight message.
 * @param {String} message
 */
OutputIface.prototype.highlight =
function(message) {

    throw new Error("ConsoleIface.highlight() not implemented.");
};


/**
 * Output string without trailing newline.
 * @param {String} message
 * @param {Boolean} [toStderr] Whether to write on stderr.
 *                             Default is stdout if applicable for the implementation
 */
OutputIface.prototype.put =
function(message, toStderr) {

    throw new Error("ConsoleIface.put() not implemented.");
};

module.exports = OutputIface;
