// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

/**
 * Manifest wrapper.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 */
function Manifest(output, path) {

    var buffer = FS.readFileSync(path, {"encoding": "utf8"});
    var json = JSON.parse(buffer);

    // App version is [major.][minor.]micro
    // Major and minor need to be < 100, micro < 1000
    if (json.crosswalk_app_version &&
        json.crosswalk_app_version.match("^([0-9]+\.){0,2}[0-9]+$")) {

        var valid = true;
        var numbers = json.crosswalk_app_version.split(".");
        for (var i = 0; i < numbers.length; i++) {
            if (i == numbers.length - 1 &&
                numbers[i] >= 1000) {
                // Last component, up to 3 digits
                output.warning("App version part '" + numbers[i] + "' must be < 1000");
                valid = false;
                break;
            } else if (i < numbers.length - 1 &&
                       numbers[i] >= 100) {
                // First 2 components, up to 2 digits
                output.warning("App version part '" + numbers[i] + "' must be < 100");
                valid = false;
                break;
            }
        }

        if (valid) {
            this._appVersion = json.crosswalk_app_version;
        }
    }

    if (!this._appVersion) {
        output.error("Invalid app version '" + json.crosswalk_app_version + "' in the manifest");
        // TODO maybe exception
    }

    // Target platforms
    if (json.crosswalk_target_platforms &&
        typeof json.crosswalk_target_platforms === "string") {
        this._targetPlatforms = json.crosswalk_target_platforms;
    }

    if (!this._targetPlatforms) {
        output.error("Missing or invalid target platforms in the manifest");
        output.error("Try adding");
        output.error('    "crosswalk_target_platforms": "android"');
        output.error("or similar for platform of choice.");
    }

    // Windows update ID
    // Optional field, only check if present.
    this._windowsUpdateId = null;
    if (json.crosswalk_windows_update_id) {

        var parts = json.crosswalk_windows_update_id.split("-");
        if (parts.length === 5 &&
            parts[0].length === 8 && parts[0].match("^[0-9]*$") &&
            parts[1].length === 4 && parts[1].match("^[0-9]*$") &&
            parts[2].length === 4 && parts[2].match("^[0-9]*$") &&
            parts[3].length === 4 && parts[3].match("^[0-9]*$") &&
            parts[4].length === 12 && parts[4].match("^[0-9]*$")) {

            this._windowsUpdateId = json.crosswalk_windows_update_id;

        } else {

            output.error("Invalid Windows Update ID + '" + json.crosswalk_windows_update_id + "'");
        }
    }

    // Windows vendor field
    // Optional field, only check if present.
    this._windowsVendor = null;
    if (json.crosswalk_windows_vendor) {
        if (typeof json.crosswalk_windows_vendor === "string") {
            this._windowsVendor = json.crosswalk_windows_vendor;
        } else {
            output.error("Windows target: Invalid vendor field + '" + json.crosswalk_windows_vendor + "'");
        }
    }
}

/**
 * Create manifest at project creation stage.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 * @returns {Manifest} Loaded manifest instance.
 * @memberOf Manifest
 * @static
 */
Manifest.create =
function(path) {

    // Emulate old behaviour of using default backend,
    // Just put it into the manifest now, upon creation.
    var PlatformsManager = require("./PlatformsManager");
    var mgr = new PlatformsManager(require("./TerminalOutput").getInstance());
    var platformInfo = mgr.loadDefault();

    // Create windows update id
    // Format is: 12345678-1234-1234-1234-111111111111
    // So we create 32+ random digits, then insert dashes.
    var digits = "";
    while (digits.length <= 32) {
        // Cut off leading "0."
        var randoms = Math.random().toString().substring(2);
        digits += randoms;
    }
    var windowsUpdateId = digits.substring(0, 8) + "-" +
                          digits.substring(8, 12) + "-" +
                          digits.substring(12, 16) + "-" +
                          digits.substring(16, 20) + "-" +
                          digits.substring(20, 32);

    var buffer = JSON.stringify({
        "crosswalk_app_version": "1",
        "crosswalk_target_platforms": platformInfo.platformId,
        "crosswalk_windows_update_id": windowsUpdateId,
        "crosswalk_windows_vendor": "(Vendor)"  // optional, placeholder
    });
    FS.writeFileSync(path, buffer);
};

/**
 * Application version a.b.c where a,b < 100, c < 1000
 * @member {String} version
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "appVersion", {
                      get: function() {
                                return this._appVersion;
                           }
                      });

/**
 * Build target platforms for the apps
 * @member {String} targetPlatforms
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "targetPlatforms", {
                      get: function() {
                                return this._targetPlatforms;
                           }
                      });

/**
 * Windows update ID
 * @member {String} windowsUpdateId
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "windowsUpdateId", {
                      get: function() {
                                return this._windowsUpdateId;
                           }
                      });

/**
 * Vendor field for Windows
 * @member {String} windowsVendor
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "windowsVendor", {
                      get: function() {
                                return this._windowsVendor;
                           }
                      });

module.exports = Manifest;
