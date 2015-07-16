// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Interface for project implementations.
 * @constructor
 * @param {Function} PlatformBase Base class constructor {@link PlatformBase}
 * @param {PlatformData} platformData Init data passed to the platform
 * @protected
 */
function WinPlatform(PlatformBase, baseData) {

    // Create base instance.
    var instance = new PlatformBase(baseData);

    // Override manually, because Object.extend() is not yet available on node.
    var names = Object.getOwnPropertyNames(WinPlatform.prototype);
    for (var i = 0; i < names.length; i++) {
        var key = names[i];
        if (key != "constructor") {
            instance[key] = WinPlatform.prototype[key];
        }
    }

    return instance;
}

/**
 * Custom command line arguments.
 * @static
 */
WinPlatform.getArgs = function() {

    return {
        create: { // Extra options for command "create"
            foo: "Option added by the backend",
            bar: "Another option added by the backend"
        },
        update: { // Extra options for command "update"
            baz: "Another option added by the backend"
        }
    };
};

/**
 * Implements {@link PlatformBase.create}
 */
WinPlatform.prototype.create =
function(packageId, args, callback) {

    // TODO implement generation of project.
    this.output.write("WinPlatform: Generating " + this.packageId + "\n");

    // Null means success, error string means failure.
    callback(null);
};

/**
 * Implements {@link PlatformBase.update}
 */
WinPlatform.prototype.update =
function(versionSpec, args, callback) {

    // TODO implement updating of project to new Crosswalk version.
    // This function is not supported yet.
    this.output.log("WinPlatform: Updating project\n");

    // Null means success, error string means failure.
    callback(null);
};

WinPlatform.prototype.refresh =
function(callback) {

    // TODO implement updating of project to new Crosswalk version.
    // Maybe this function will be not needed, and removed in the future.
    this.output.log("WinPlatform: Refreshing project\n");

    // Null means success, error string means failure.
    callback(null);
};

/**
 * Implements {@link PlatformBase.build}
 */
WinPlatform.prototype.build =
function(configId, args, callback) {

    // TODO implement updating of project to new Crosswalk version.
    this.output.log("WinPlatform: Building project\n");

    // Null means success, error string means failure.
    callback(null);
};

module.exports = WinPlatform;
