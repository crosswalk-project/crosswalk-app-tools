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
        },
        build: { // Extra options for command "build"
            googleApiKeyName: "\t\tGoogle API key name in ~/.crosswalk-app-tools-keys.json"
        }
    };
};

/**
 * Check host setup.
 * @param {OutputIface} output Output to write to
 * @param {Function} callback Function(success) to be called when done
 * @static
 */
WinPlatform.check =
WinPlatform.prototype.check =
function(output, callback) {

    // Checking deps
    var deps = [
        "candle",
        "light"
    ];

    var found = true;
    deps.forEach(function (dep) {
        var path = ShellJS.which(dep);
        var msg = "Checking for " + dep + "...";
        if (path) {
            output.info(msg, path);
        } else {
            found = false;
            output.error(msg + " " + path);
        }
    });

    callback(found);
};

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution
 * @returns {Boolean} True on success.
 */
WinPlatform.prototype.importCrosswalkFromDisk =
function(crosswalkPath) {

    // Namespace util
    var util = this.application.util;
    var output = this.output;

    if (!crosswalkPath) {
        output.error("Use --windows-crosswalk=<path> to pass crosswalk zip");
        return false;
    } else if (!ShellJS.test("-e", crosswalkPath)) {
        output.error("Crosswalk zip could not be found: " + crosswalkPath);
        return false;
    }

    var version = null;
    if (ShellJS.test("-d", crosswalkPath)) {
        ShellJS.mkdir(this.platformPath);
        ShellJS.cp("-r", Path.join(crosswalkPath, "*"), this.platformPath);
        version = util.Version.createFromFile(Path.join(crosswalkPath, "VERSION"));
    } else {
        var xwalk = new util.CrosswalkZip(crosswalkPath);
        var entry = xwalk.getEntry(xwalk.root);
        xwalk.extractEntryTo(entry, this.platformPath);
        version = xwalk.version;
    }

    return version.toString();
};

/**
 * Implements {@link PlatformBase.create}
 */
WinPlatform.prototype.create =
function(packageId, args, callback) {

    // Namespace util
    var util = this.application.util;
    var output = this.output;

    var versionSpec = null;
    if (args.crosswalk) {
        // TODO verify version/channel
        versionSpec = args.crosswalk;
    } else {
        versionSpec = "stable";
        output.info("Defaulting to download channel " + versionSpec);
    }

    var deps = new util.Download01Org(this.application, "windows", "stable" /* FIXME this is just a placeholder */);
    deps.importCrosswalk(versionSpec,
                         function(path) {
                             return this.importCrosswalkFromDisk(path);
                         }.bind(this),
                         function(version, errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback("Creating project template failed");
            return;
        }

        output.info("Project template created at", this.platformPath);
        callback(null);
    }.bind(this));
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
        ShellJS.cp(Path.join(__dirname, "..", "..", "app-template", "crosswalk.ico"), winIcon);
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

    // Namespace util
    var util = this.application.util;

    var output = this.output;
    var manifest = this.application.manifest;

    if (!configId) {
        configId = "debug";
    }

    var googleKeys = null;
    if (args.googleApiKeyName) {
        try {
            googleKeys = util.Keys.getGoogleApiKeys(args.googleApiKeyName);
            output.info("Using Google API Key '" + args.googleApiKeyName + "'");
        } catch (e) {
            output.error("Failed loading Google API Key '" + args.googleApiKeyName + "'");
            output.error(e.message);
            output.error("Google APIs will not be functional");
        }
    }

    // WiX wants 4 component version numbers, so append as many ".0" as needed.
    // Manifest versions are restricted to 4 parts max.
    var nComponents = manifest.appVersion.split(".").length;
    var versionPadding = new Array(4 - nComponents + 1).join(".0");

    var sdk = new WixSDK(this.application.rootPath, manifest, this.output);
    var indicator = output.createInfiniteProgress("Building package");
    sdk.onData = function(data) {
        data = data.toString();
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
        configId: configId,
        app_name: manifest.name,
        upgrade_id: manifest.windowsUpdateId,
        manufacturer: this.getVendor(),
        version: manifest.appVersion + versionPadding,
        is_64_bit: true,
        icon: this.selectIcon(),
        product: manifest.packageId,
        googleApiKeys: googleKeys
    };
    sdk.generateMSI(this.appPath, this.platformPath, metaData,
                    function (success) {

        if (success) {
            indicator.done();
            this.exportPackage(metaData.msi);
            output.highlight("Package: " + Path.basename(metaData.msi));
            callback(null);
        } else {
            indicator.update("error");
            callback("Building " + this.packageId + " failed");
        }
        return;
    }.bind(this));
};

module.exports = WinPlatform;
