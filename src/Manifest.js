// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require("path");

var FormatJson = require("format-json");
var ParseColor = require('parse-color');
var ShellJS = require("shelljs");

var CommandParser = require("./CommandParser");
var IllegalAccessException = require("./util/exceptions").IllegalAccessException;

/**
 * Manifest wrapper.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 * @constructor
 */
function Manifest(output, path) {

    this._output = output;
    this._path = path;

    var buffer = FS.readFileSync(path, {"encoding": "utf8"});
    var json = JSON.parse(buffer);

    // App version is [major.][minor.]micro
    // Major and minor need to be < 100, micro < 1000
    if (json.xwalk_app_version &&
        json.xwalk_app_version.match("^([0-9]+\.){0,2}[0-9]+$")) {

        var valid = true;
        var numbers = json.xwalk_app_version.split(".");
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
            this._appVersion = json.xwalk_app_version;
        }
    }

    if (!this._appVersion) {
        output.error("Invalid app version '" + json.xwalk_app_version + "' in the manifest");
        throw new Error("Invalid app version '" + json.xwalk_app_version + "' in the manifest");
    }

    // Splash background colour
    this._backgroundColor = "#ffffff";
    if (json.background_color) {
        var color = ParseColor(json.background_color);
        if (color && color.hex) {
            this._backgroundColor = color.hex;
        } else {
            output.warning("Failed to parse background_color " + json.background_color);
        }
    }

    // Name
    if (json.name &&
        typeof json.name === "string") {
        this._name = json.name;
    }

    if (!this._name) {
        output.warning("Invalid or missing field 'name' in manifest.json");
    }

    // Short name
    if (json.short_name &&
        typeof json.short_name === "string") {
        this._shortName= json.short_name;
    }

    var values;

    // Display
    this._display = "standalone";
    if (json.display) {

        values = ["fullscreen", "standalone", "minimal-ui", "browser"];

        if (values.indexOf(json.display) > -1) {
            // supported mode
            this._display = json.display;
        } else {
            output.warning("Unsupported value '" + json.display + "' for 'display' in manifest.json");
        }
    }

    // Orientation
    this._orientation = "any";
    if (json.orientation) {

        values = [ "any",
                   "natural",
                   "landscape",
                   "portrait",
                   "portrait-primary",
                   "portrait-secondary",
                   "landscape-primary",
                   "landscape-secondary" ];

        if (values.indexOf(json.orientation) > -1) {
            // supported mode
            this._orientation = json.orientation;
        } else {
            output.warning("Unsupported value '" + json.orientation + "' for 'orientation' in manifest.json");
        }
    }

    // Start URL
    // TODO check value
    if (json.start_url &&
        typeof json.start_url === "string") {
        this._startUrl = json.start_url;
    }

    // Icons
    this._icons = [];
    if (json.icons) {
        // TODO validate
        this._icons = json.icons;
    }

    // Command line params
    this._commandLine = null;
    if (json.xwalk_command_line) {
        if (typeof json.xwalk_command_line === "string") {
            this._commandLine = json.xwalk_command_line;
        } else {
            output.warning("Invalid command line '" + json.xwalk_command_line + "'");
        }
    }

    // Package ID
    if (json.xwalk_package_id &&
        CommandParser.validatePackageId(json.xwalk_package_id, this._output)) {
        this._packageId = json.xwalk_package_id;
    } else {
        throw new Error("manifest.json: Invalid package ID '" + json.xwalk_package_id + "'");
    }

    // Extensions
    this._extensions = [];
    if (json.xwalk_extensions) {
        if (json.xwalk_extensions instanceof Array) {
            json.xwalk_extensions.forEach(function (path) {
                var absPath = Path.resolve(Path.dirname(this._path), path);
                absPath = Path.normalize(absPath);
                if (ShellJS.test("-e", absPath)) {
                    this._extensions.push(absPath);
                } else {
                    output.warning("Skipping extension because dir not found: " + absPath);
                }
            }.bind(this));
        } else {
            output.warning("Invalid extensions " + json.xwalk_extensions);
        }
    }
    // Absolute path of Extension Hooks.
    // This info is needed to skip them when generating MSI.
    this._extensionHooks = [];
    this._extensions.forEach(function(extension, i){
      var path = Path.join(extension, "XWalkExtensionHooks.js");
      if (ShellJS.test("-f", path)) {
        this._extensionHooks.push(path);
      }
    }.bind(this));

    // Target platforms
    if (json.xwalk_target_platforms &&
        json.xwalk_target_platforms instanceof Array) {
        this._targetPlatforms = json.xwalk_target_platforms;
    }

    if (!this._targetPlatforms) {
        output.error("Missing or invalid target platforms in the manifest");
        output.error("Try adding");
        output.error('    "xwalk_target_platforms": [ "android" ]');
        output.error("or similar for platform of choice.");
    }

    // Android animatable view
    this._androidAnimatableView = false;
    if (json.xwalk_android_animatable_view) {

        // Recognise boolean or string true.
        if (typeof json.xwalk_android_animatable_view === "boolean" ||
        json.xwalk_android_animatable_view === "true") {
            this._androidAnimatableView = true;
        }
    }

    // Android "keep screen on"
    this._androidKeepScreenOn = false;
    if (json.xwalk_android_keep_screen_on) {

        // Recognise boolean or string true.
        if (typeof json.xwalk_android_keep_screen_on === "boolean" ||
        json.xwalk_android_keep_screen_on === "true") {
            this._androidKeepScreenOn = true;
        }
    }

    // Android permissions
    this._androidPermissions = Manifest.ANDROID_DEFAULT_PERMISSIONS.concat([]); // clone array
    if (json.xwalk_android_permissions) {
        if (json.xwalk_android_permissions instanceof Array) {
            // Merge permissions to the default ones.
            json.xwalk_android_permissions.forEach(function (permission) {
                if (this._androidPermissions.indexOf(permission) < 0) {
                    this._androidPermissions.push(permission);
                }
            }.bind(this));
        } else {
            output.warning("Invalid android permissions '" + json.xwalk_android_permissions + "'");
        }
    }

    // Android webp
    this._androidWebp = false;
    if (json.xwalk_android_webp) {

        if (typeof json.xwalk_android_webp === "string") {
            // TODO better check
            this._androidWebp = json.xwalk_android_webp;
        } else {
            output.warning("Invalid webp parameters '" + json.xwalk_android_webp + "'");
        }
    }

    // Windows update ID
    // Optional field, only check if present.
    this._windowsUpdateId = null;
    if (json.xwalk_windows_update_id) {

        var parts = json.xwalk_windows_update_id.split("-");
        if (parts.length === 5 &&
            parts[0].length === 8 && parts[0].match("^[0-9]*$") &&
            parts[1].length === 4 && parts[1].match("^[0-9]*$") &&
            parts[2].length === 4 && parts[2].match("^[0-9]*$") &&
            parts[3].length === 4 && parts[3].match("^[0-9]*$") &&
            parts[4].length === 12 && parts[4].match("^[0-9]*$")) {

            this._windowsUpdateId = json.xwalk_windows_update_id;

        } else {

            output.error("Invalid Windows Update ID + '" + json.xwalk_windows_update_id + "'");
        }
    }

    // Windows vendor field
    // Optional field, only check if present.
    this._windowsVendor = null;
    if (json.xwalk_windows_vendor) {
        if (typeof json.xwalk_windows_vendor === "string") {
            this._windowsVendor = json.xwalk_windows_vendor;
        } else {
            output.error("Windows target: Invalid vendor field + '" + json.xwalk_windows_vendor + "'");
        }
    }
}

/**
 * Default permissions needed on android.
 */
Manifest.ANDROID_DEFAULT_PERMISSIONS = [ "ACCESS_NETWORK_STATE", "ACCESS_WIFI_STATE", "INTERNET" ];

/**
 * Create default manifest data.
 * @param {String} packageId Unique package identifier com.example.foo
 * @returns {Object} Manifest JSON representation
 * @memberOf Manifest
 * @static
 */
Manifest.createDefaultJson =
function(packageId) {

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

    return {
        // Standard fields
        "name": packageId,
        "short_name": packageId.split(".").pop(),
        "background_color": "#ffffff",
        "display": "standalone",
        "orientation": "any",
        "start_url": "index.html",
        // Crosswalk fields
        "xwalk_app_version": "0.1",
        "xwalk_command_line": "",
        "xwalk_package_id": packageId,
        "xwalk_target_platforms": [ platformInfo.platformId ],
        // Android fields
        "xwalk_android_animatable_view": false,
        "xwalk_android_keep_screen_on": false,
        // Set external storage by default, needed for shared mode/fallback.
        "xwalk_android_permissions": Manifest.ANDROID_DEFAULT_PERMISSIONS,
        // Windows fields
        "xwalk_windows_update_id": windowsUpdateId
    };
};

/**
 * Create manifest at project creation stage.
 * @param {String} path Path to manifest.json
 * @param {String} packageId Unique package identifier com.example.foo
 * @memberOf Manifest
 * @static
 */
Manifest.create =
function(path, packageId) {

    var json = Manifest.createDefaultJson(packageId);

    // Default icon
    var icon = {
        src: "icon.png",
        sizes: "72x72"
    };

    json.icons = [ icon ];
    FS.writeFileSync(path, FormatJson.plain(json));
};

/**
 * Add missing default fields to manifest.
 * @param {String} path Path to manifest.json
 * @param {String} packageId Unique package identifier com.example.foo
 * @memberOf Manifest
 * @static
 */
Manifest.addDefaults =
function(output, path, packageId) {

    var buffer;
    var json = {};
    if (ShellJS.test("-f", path)) {
        buffer = FS.readFileSync(path, {"encoding": "utf8"});
        json = JSON.parse(buffer);
    } else {
        output.warning("File does not exist, creating default manifest.json");
    }

    // Just a shallow assignment of missing fields.
    var defaultsJson = Manifest.createDefaultJson(packageId);
    for (var key in defaultsJson) {
        if (!json[key]) {
            json[key] = defaultsJson[key];
        }
    }

    // Always overwrite xwalk_package_id
    json.xwalk_package_id = packageId;

    // Write back
    buffer = FormatJson.plain(json);
    FS.writeFileSync(path, buffer);
};

/**
 * Update fields in Manifest.json
 * @param {Object} data Data object
 * @returns {Boolean} True on success, false on failure
 * @private
 */
Manifest.prototype.update =
function(data) {

    var buffer = FS.readFileSync(this._path, {"encoding": "utf8"});
    if (!buffer) {
        this._output.error("Failed to read '" + this._path + "'");
        return false;
    }

    var json = JSON.parse(buffer);
    if (!json) {
        this._output.error("Failed to parse '" + this._path + "'");
        return false;
    }

    // Update JSON
    for (var prop in data) {
        json[prop] = data[prop];
    }

    // Write back
    buffer = FormatJson.plain(json);
    FS.writeFileSync(this._path, buffer);

    return true;
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
 * Application name
 * @member {String} name
 * @throws {IllegalAccessException} If name is not a string.
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "name", {
                      get: function() {
                                return this._name;
                           },
                      set: function(name) {
                                if (typeof name === "string") {
                                    this._name = name;
                                    this.update({"name": this._name});
                                } else {
                                    var errormsg = "Invalid app name '" + name + "'";
                                    this._output.error(errormsg);
                                    throw new IllegalAccessException(errormsg);
                                }
                           }
                      });

/**
 * Application short name.
 * @member {String} shortName
 * @throws {IllegalAccessException} If name is not a string.
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "shortName", {
                      get: function() {
                                return this._shortName;
                           },
                      set: function(shortName) {
                                if (typeof shortName === "string") {
                                    this._shortName = shortName;
                                    this.update({"short_name": this._shortName});
                                } else {
                                    var errormsg = "Invalid app short name '" + shortName + "'";
                                    this._output.error(errormsg);
                                    throw new IllegalAccessException(errormsg);
                                }
                           }
                      });

/**
 * Background color at launch time
 * @member {String} backgroundColor
 * @instance
 * @memberOf Manifest
 * @see http://www.w3.org/TR/appmanifest/#background_color-member
 */
Object.defineProperty(Manifest.prototype, "backgroundColor", {
                      get: function() {
                                return this._backgroundColor;
                           }
                      });

/**
 * Display
 * @member {String} display
 * @instance
 * @memberOf Manifest
 * @see http://www.w3.org/TR/appmanifest/#display-member
 */
Object.defineProperty(Manifest.prototype, "display", {
                      get: function() {
                                return this._display;
                           }
                      });

/**
 * Orientation
 * @member {String} orientation
 * @instance
 * @memberOf Manifest
 * @see https://w3c.github.io/manifest/#orientation-member
 */
Object.defineProperty(Manifest.prototype, "orientation", {
                      get: function() {
                                return this._orientation;
                           }
                      });

/**
 * Icons
 * @member {String} icons
 * @instance
 * @memberOf Manifest
 * @see https://w3c.github.io/manifest/#icons-member
 */
Object.defineProperty(Manifest.prototype, "icons", {
                      get: function() {
                                return this._icons;
                           }
                      });

/**
 * Start URL
 * @member {String} startUrl
 * @instance
 * @memberOf Manifest
 * @see http://www.w3.org/TR/appmanifest/#start_url-member
 */
Object.defineProperty(Manifest.prototype, "startUrl", {
                      get: function() {
                                return this._startUrl;
                           }
                      });

/**
 * Command line params
 * @member {String} commandLine
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "commandLine", {
                      get: function() {
                                return this._commandLine;
                           }
                      });

/**
 * Package ID
 * @member {String} packageId
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "packageId", {
                      get: function() {
                                return this._packageId;
                           }
                      });

/**
 * Animatable view on android.
 * @member {String} androidAnimatableView
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "androidAnimatableView", {
                      get: function() {
                                return this._androidAnimatableView;
                           }
                      });

/**
 * "Keep screen on" on android.
 * @member {String} androidKeepScreenOn
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "androidKeepScreenOn", {
                      get: function() {
                                return this._androidKeepScreenOn;
                           }
                      });

/**
 * Android permissions.
 * @member {String} androidPermissions
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "androidPermissions", {
                      get: function() {
                                return this._androidPermissions;
                           }
                      });

/**
 * Android webp conversion.
 * @member {String} androidWebp
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "androidWebp", {
                      get: function() {
                                return this._androidWebp;
                           }
                      });

/**
 * Extensions.
 * @member {String} extensions
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "extensions", {
                      get: function() {
                                return this._extensions;
                           }
                      });

/**
 * Extension hooks.
 * @member {String} extensionHooks
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "extensionHooks", {
                      get: function() {
                                return this._extensionHooks;
                           }
                      });
/**
 * Build target platforms for the apps
 * @member {String[]} targetPlatforms
 * @throws {IllegalAccessException} If unknown target platforms are set.
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "targetPlatforms", {
                      get: function() {
                                return this._targetPlatforms;
                           },
                      set: function(targetPlatforms) {
                                var PlatformsManager = require("./PlatformsManager");
                                var mgr = new PlatformsManager(this._output);
                                var ret = targetPlatforms.every(function (platform) {
                                    return mgr.load(platform);
                                });
                                if (ret) {
                                    this._targetPlatforms = targetPlatforms;
                                    this.update({"xwalk_target_platforms": this._targetPlatforms});
                                } else {
                                    throw new IllegalAccessException(errormsg);
                                }
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
