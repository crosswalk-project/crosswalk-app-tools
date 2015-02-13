// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var IllegalAccessException = require("./util/exceptions").IllegalAccessException;

/**
 * Create Application object.
 * @constructor
 * @protected
 */
function Application() {

}

/**
 * Read-only {@link Config} object.
 * @member {Config} config
 * @throws {IllegalAccessException} If writing this property is attempted.
 * @instance
 * @memberOf Application
 */
Object.defineProperty(Application.prototype, "config", {
                      get: function() {
                                return require("./Config").getInstance();
                           },
                      set: function(config) {
                                throw new IllegalAccessException("Attempting to write read-only property Application.config");
                           }
                      });

/**
 * Get singleton {@link OutputIface} object.
 * @returns {OutputIface} Output object.
 */
Application.prototype.getOutput =
function() {

    return require("./TerminalOutput").getInstance();
};

module.exports = Application;
