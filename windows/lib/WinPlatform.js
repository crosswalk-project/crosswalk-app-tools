// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

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
 * Pick windows icon (.ico) from web manifest.
 * @returns {String} Manifest icon or fallback default icon if not found.
 */
WinPlatform.prototype.selectIcon =
function() {

    var output = this.output;

    var icons = this.application.manifest.icons;
    var winIcon = null;
    if (icons && icons.length > 0) {
        for (var i = 0; i < icons.length; i++) {
            var icon = icons[i];
            var ext = Path.extname(icon.src).toLowerCase();
            if (ext === ".ico") {
                winIcon = icon.src;
                break;
            }
        }
    }

    if (winIcon) {
        winIcon = Path.join(this.appPath, winIcon);
    } else {
        output.warning("No icon in '.ico' format found in the manifest");
        output.warning("Using default crosswalk.ico");
        winIcon = Path.join(this.appPath, "crosswalk.ico");
    }

    return winIcon;
};

/**
 * Get vendor name from manifest. Fall back to namespace when missing.
 * @returns {String} Vendor name.
 */
WinPlatform.prototype.getVendor =
function() {

    var manifest = this.application.manifest;

    var vendor = manifest.windowsVendor;
    if (!vendor) {
        // Use 2 leading parts of package ID
        // this will go wrong for namespaces like co.uk.foo,
        // but it's a start.
        var parts = manifest.packageId.split(".");
        vendor = parts[0] + "." + parts[1];
    }

    return vendor;
};

/**
 * Implements {@link PlatformBase.build}
 */
WinPlatform.prototype.build =
function(configId, args, callback) {

    var output = this.output;
    var manifest = this.application.manifest;

    // WiX wants 4 component version numbers, so append as many ".0" as needed.
    // Manifest versions are restricted to 4 parts max.
    var nComponents = manifest.appVersion.split(".").length;
    var versionPadding = new Array(4 - nComponents + 1).join(".0");

    var sdk = new WixSDK(this.output);
    var indicator = output.createInfiniteProgress("Building package");
    sdk.onData = function(data) {
        this.logOutput.write(data);
        var keys = [
            "Updating",
            "Creating",
            "Generating",
            "Merging",
            "Validating",
            "ICE"
        ];
        // If a line begins with a key, then update the
        // indicator with it.
        keys.forEach(function (key) {
            if (data.substring(0, key.length) === key) {
                var endIdx = key === "ICE" ?
                    data.indexOf(":") :
                    key.length;
                var tag = data.substring(0, endIdx);
                indicator.update(tag.toLowerCase());
            }
        });
    }.bind(this);

    var metaData = {
        app_name: manifest.name,
        upgrade_id: manifest.windowsUpdateId,
        manufacturer: this.getVendor(),
        version: manifest.appVersion + versionPadding,
        is_64_bit: true,
        icon: this.selectIcon(),
        product: manifest.packageId
        //extensions: 'tests/extension/echo_extension'
    };
    sdk.generateMSI(this.appPath, this.platformPath, metaData,
                    function (success) {

        if (success) {
            indicator.done();
            // TODO rename so they include version number
            output.highlight("  * Built package(s):");
            output.highlight("    + " + metaData.msi);
            callback(null);
        } else {
            indicator.update("error");
            callback("Building " + this.packageId + " failed");
        }
        return;
    }.bind(this));

    // Null means success, error string means failure.
    callback(null);
};

module.exports = WinPlatform;
