// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * @namespace exceptions
 */

/**
 * Creates a new FileCreationFailed.
 * @extends Error
 * @constructor
 * @param {String} message Error message
 * @memberOf exceptions
 */
function FileCreationFailed(message) {
    Error.call(this, message);
}
FileCreationFailed.prototype = Error.prototype;

/**
 * Creates a new IllegalAccessException.
 * @extends Error
 * @constructor
 * @param {String} message Error message
 * @memberOf exceptions
 */
function IllegalAccessException(message) {
    Error.call(this, message);
}
IllegalAccessException.prototype = Error.prototype;

/**
 * Creates a new InvalidPathException.
 * @extends Error
 * @constructor
 * @param {String} message Error message
 * @memberOf exceptions
 */
function InvalidPathException(message) {
    Error.call(this, message);
}
InvalidPathException.prototype = Error.prototype;



module.exports = {
    FileCreationFailed: FileCreationFailed,
    IllegalAccessException: IllegalAccessException,
    InvalidPathException: InvalidPathException
};
