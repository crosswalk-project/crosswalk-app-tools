// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ShellJS = require("shelljs");

var WixSDK = require("./WixSDK");

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
            crosswalk: "\t\t\tPath to crosswalk zip"
        }/*,
        update: { // Extra options for command "update"
            baz: "Another option added by the backend"
        }*/
    };
};

/**
 * Implements {@link PlatformBase.create}
 */
WinPlatform.prototype.create =
function(packageId, args, callback) {

    // Namespace util
    var util = this.application.util;
    var output = this.output;
    
    var crosswalkPath = args.crosswalk;
    if (!crosswalkPath) {
        callback("Use --windows-crosswalk=<path> to pass crosswalk zip");
        return;
    } else if (!ShellJS.test("-f", crosswalkPath)) {
        callback("Crosswalk zip could not be found: " + crosswalkPath);
        return;
    }

    var zip = new util.CrosswalkZip(crosswalkPath);
    zip.extractEntryTo(zip.root, this.platformPath);
    if (!ShellJS.test("-d", this.platformPath)) {
        callback("Failed to extract crosswalk zip");
        return;
    }

    output.info("Successfully imported " + crosswalkPath);

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
    this.output.log("WinPlatform: TODO Updating project\n");

    // Null means success, error string means failure.
    callback(null);
};

WinPlatform.prototype.refresh =
function(callback) {

    // TODO implement updating of project to new Crosswalk version.
    // Maybe this function will be not needed, and removed in the future.
    this.output.log("WinPlatform: TODO Refreshing project\n");

    // Null means success, error string means failure.
    callback(null);
};

/**
 * Implements {@link PlatformBase.build}
 */
WinPlatform.prototype.build =
function(configId, args, callback) {

    var sdk = new WixSDK();
/*
const kAppSourceDir = './app';  // Path to the application root directory having 'manifest.json'.
const kCrosswalkDir = './crosswalk-windows-14.43.343.0';  // Path to the directory with Crosswalk binaries.
const kProductIcon = './crosswalk.ico';   // Icon for shortcut and for program list in Control Panel.
const kAppName = 'Hello_app';
const kCompanyName = 'Hello_company';
const kProductName = 'Hello_product';
const kProductVersion = '0.0.0.1';
const kUpgradeCode = '12345678-1234-1234-1234-111111111111';  // Has to be the same for all product versions.
const kIs64Bit = true;

GenerateMSI(kAppSourceDir, kCrosswalkDir, {
    app_name: kAppName,
    upgrade_id: kUpgradeCode,
    manufacturer: kCompanyName,
    version: kProductVersion,
    is_64_bit: true,
    icon: kProductIcon,
    extensions: 'tests/extension/echo_extension'
});
*/
    // Null means success, error string means failure.
    callback(null);
};

module.exports = WinPlatform;
