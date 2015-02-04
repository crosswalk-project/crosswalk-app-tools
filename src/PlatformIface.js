// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config.js");

/**
 * Callback signature for {@link PlatformIface.generate}
 * @param {String} errormsg null on success, otherwise error message.
 * @memberOf PlatformIface
 * @inner
 */
function platformIfaceOperationCb(result) {}

/**
 * Interface for platform implementations.
 * @constructor
 * @param {Object} application global {@link Application} instance
 * @protected
 */
function PlatformIface(application) {}

/**
 * Generate platform project template.
 * @param {String} packageId Package name in com.example.Foo format.
 * @param {Function} callback see {@link PlatformIface~platformIfaceOperationCb}.
 */
PlatformIface.prototype.generate =
function(packageId, callback) {

    throw new Error("PlatformIface.generate() not implemented.");
};

/**
 * Update platform project to latest Crosswalk.
 */
PlatformIface.prototype.update =
function() {

    throw new Error("PlatformIface.update() not implemented.");
};

/**
 * Refresh platform project after environment changes.
 */
PlatformIface.prototype.refresh =
function() {

    throw new Error("PlatformIface.refresh() not implemented.");
};

/**
 * Build application package.
 * @param {String[]} abi Array of ABIs, supported armeabi-v7a, x86.
 * @param {Boolean} release Whether to build debug or release package.
 * @param {Function} callback see {@link PlatformIface~platformIfaceOperationCb}.
 */
PlatformIface.prototype.build =
function(abis, release, callback) {

    throw new Error("PlatformIface.build() not implemented.");
};

module.exports = new PlatformIface();
