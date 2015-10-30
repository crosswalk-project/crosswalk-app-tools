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
function DemoPlatform(PlatformBase, baseData) {

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

    return instance;
}

/**
 * Custom command line arguments.
 * @static
 */
DemoPlatform.getArgs = function() {

    return {
        create: { // Extra options for command "create"
            foo: "Option added by the backend",
            bar: "Another option added by the backend"
        }
    };
};

/**
 * Implements {@link PlatformBase.create}
 */
DemoPlatform.prototype.create =
function(packageId, args, callback) {

    // TODO implement generation of project.
    this.output.write("DemoPlatform: Generating " + this.packageId + "\n");

    // Null means success, error string means failure.
    callback(null);
};

/**
 * Implements {@link PlatformBase.build}
 */
DemoPlatform.prototype.build =
function(configId, args, callback) {

    // TODO implement updating of project to new Crosswalk version.
    this.output.log("DemoPlatform: Building project\n");

    // Null means success, error string means failure.
    callback(null);
};

module.exports = DemoPlatform;
