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
 * An error is a condition from which recovery is not possible, and
 * the program needs to terminate. For less severe conditions where
 * recovery is possible, use warnings.
 * @param {String} message
 */
OutputIface.prototype.error =
function(message) {

    throw new Error("OutputIface.error() not implemented.");
};

/**
 * Log a warning message.
 * A warning is appropriate for an unexpected condition that the program
 * can recover from, such as invalid input, when retry is possible.
 * @param {String} message
 */
OutputIface.prototype.warning =
function(message) {

    throw new Error("OutputIface.warning() not implemented.");
};

/**
* Log an information message.
* Printing an info message is the way to inform about progress,
* such as the completion of a step when creating a project or
* building packages.
* @param {String} message
* @param {String} [path]
*/
OutputIface.prototype.info =
function(message, path) {

    throw new Error("OutputIface.info() not implemented.");
};

/**
 * Print highlighted message.
 * A highlighted message is recommended for summarising the result
 * of an operation, such as displaying the package names that have
 * been built.
 * @param {String} message
 */
OutputIface.prototype.highlight =
function(message) {

    throw new Error("OutputIface.highlight() not implemented.");
};

/**
 * Write message.
 * Write raw message to the output.
 * @param {String} message
 */
OutputIface.prototype.write =
function(message) {

    throw new Error("OutputIface.write() not implemented.");
};

/**
 * Extra message, only to logfile by default.
 * @param {String} message
 */
OutputIface.prototype.verbose =
function(message) {

    throw new Error("OutputIface.verbose() not implemented.");
};



module.exports = OutputIface;
