// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Application = require("./Application.js");
var Config = require("./Config.js");

/**
 * Callback signature for {@link Project.generate}
 * @function projectOperationCb
 * @param {String} errormsg null on success, otherwise error message.
 * @memberOf Project
 * @inner
 */
function projectOperationCb(result) {}

/**
 * Interface for project implementations.
 * @constructor
 * @param {Object} application global {@link Application} instance
 * @protected
 */
function Project(application) {}

/**
 * Generate project template.
 * @function generate
 * @param {String} packageId Package name in com.example.Foo format.
 * @param {Function} callback see {@link Project~projectOperationCb}.
 * @abstract
 * @instance
 * @memberOf Project
 */
Project.prototype.generate =
function(packageId, callback) {

    throw new Error("Project.generate() not implemented.");
};

/**
 * Update project to latest Crosswalk.
 * @function update
 * @abstract
 * @instance
 * @memberOf Project
 */
Project.prototype.update =
function() {

    throw new Error("Project.update() not implemented.");
};

/**
 * Refresh project after environment changes.
 * @function refresh
 * @abstract
 * @instance
 * @memberOf Project
 */
Project.prototype.refresh =
function() {

    throw new Error("Project.refresh() not implemented.");
};

/**
 * Build application package.
 * @function build
 * @param {String[]} abi Array of ABIs, supported armeabi-v7a, x86.
 * @param {Boolean} release Whether to build debug or release package.
 * @param {Function} callback see {@link Project~projectOperationCb}.
 * @abstract
 * @instance
 * @memberOf Project
 */
Project.prototype.build =
function(abis, release, callback) {

    throw new Error("Project.build() not implemented.");
};

module.exports = new Project();
