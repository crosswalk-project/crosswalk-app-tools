// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Callback signature for {@link PlatformIface.generate}.
 * @param {String} errormsg null on success, otherwise error message
 * @inner
 * @memberOf PlatformIface
 */
function platformIfaceOperationCb(result) {}

/**
 * Interface for platform implementations.
 * @constructor
 * @param {Application} application application instance
 * @protected
 */
function PlatformIface(application) {}

/**
 * Generate platform project template.
 * @param {String} packageId Package name in com.example.Foo format
 * @param {Object} options Extra options for the command
 * @param {PlatformIface~platformIfaceOperationCb} callback callback function
 */
PlatformIface.prototype.generate =
function(packageId, options, callback) {

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
 * @param {String[]} abi Array of ABIs, supported armeabi-v7a, x86
 * @param {Boolean} release Whether to build debug or release package
 * @param {PlatformIface~platformIfaceOperationCb} callback Callback function.
 */
PlatformIface.prototype.build =
function(abis, release, callback) {

    throw new Error("PlatformIface.build() not implemented.");
};

module.exports = new PlatformIface();
