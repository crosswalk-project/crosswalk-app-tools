// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Interface for project implementations.
 * @constructor
 * @param {Function} PlatformBase Base class constructor {@link PlatformBase}
 * @param {PlatformData} platformData Init data passed to the platform
 * @param {Object} args Platform-specific args, only if specified and actually given
 * @protected
 */
function DemoPlatform(PlatformBase, baseData, args) {

    // Create base instance.
    var instance = new PlatformBase(baseData);

    // Override manually, because Object.extend() is not yet available on node.
    var names = Object.getOwnPropertyNames(DemoPlatform.prototype);
    for (var i = 0; i < names.length; i++) {
        var key = names[i];
        if (key != "constructor") {
            instance[key] = DemoPlatform.prototype[key];
        }
    }

    // Print args
    for (var key in args) {
        instance.output.write("DemoPlatform " + key + ": " + args[key] + "\n");
    }

    return instance;
}

/**
 * Custom command line arguments.
 * @static
 */
DemoPlatform.getArgs = function() {

    return {
        "foo": "Option added by the backend.",
        "bar": "Another option added by the backend."
    };
};

/**
 * Generate project template.
 * @param {Object} options Extra options for the command
 * @param {PlatformBase~platformBaseOperationCb} callback callback function
 * @abstract
 */
DemoPlatform.prototype.generate =
function(options, callback) {

    // TODO implement generation of project.
    this.output.write("DemoPlatform: Generating " + this.packageId + "\n");

    // Null means success, error string means failure.
    callback(null);
};

/**
 * Update platform project to latest Crosswalk.
 * @param {String} version Version to update to, format w.x.y.z
 * @param {Object} options Extra options for the command
 * @param {PlatformBase~platformBaseOperationCb} callback callback function
 */
DemoPlatform.prototype.update =
function(version, options, callback) {

    // TODO implement updating of project to new Crosswalk version.
    // This function is not supported yet.
    this.output.log("DemoPlatform: Updating project\n");

    // Null means success, error string means failure.
    callback(null);
};

DemoPlatform.prototype.refresh =
function(callback) {

    // TODO implement updating of project to new Crosswalk version.
    // Maybe this function will be not needed, and removed in the future.
    this.output.log("DemoPlatform: Refreshing project\n");

    // Null means success, error string means failure.
    callback(null);
};

/**
 * Build application package.
 * @function build
 * @param {String[]} abi Array of ABIs, supported armeabi-v7a, x86.
 * @param {Boolean} release Whether to build debug or release package.
 * @param {Function} callback see {@link Project~projectOperationCb}.
 * @abstract
 * @memberOf Project
 */
DemoPlatform.prototype.build =
function(abis, release, callback) {

    // TODO implement updating of project to new Crosswalk version.
    this.output.log("DemoPlatform: Building project\n");

    // Null means success, error string means failure.
    callback(null);
};

module.exports = DemoPlatform;
