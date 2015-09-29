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
FileCreationFailed.prototype = Object.create(Error.prototype);
FileCreationFailed.prototype.constructor = FileCreationFailed;

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
IllegalAccessException.prototype = Object.create(Error.prototype);
IllegalAccessException.prototype.constructor = IllegalAccessException;

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
InvalidPathException.prototype = Object.create(Error.prototype);
InvalidPathException.prototype.constructor = InvalidPathException;



module.exports = {
    FileCreationFailed: FileCreationFailed,
    IllegalAccessException: IllegalAccessException,
    InvalidPathException: InvalidPathException
};
