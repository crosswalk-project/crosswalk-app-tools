// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Minimist = require("minimist");

/**
 * Parsing and validation of command-line arguments.
 * @constructor
 * @param {OutputIface} output Output implementation
 * @param {String[]} argv Command-line arguments
 * @throws {TypeError} If argv is not an array.
 */
function CommandParser(output, argv) {

    this._output = output;

    if (!(argv instanceof Array)) {
        throw new TypeError("CommandParser(argv) must be of type Array.");
    }

    this._argv = argv;
    this._createOptions = null;
}

/**
 * Get program usage information.
 * @returns {String} Usage information string.
 */
CommandParser.prototype.help =
function() {
    return "" +
        "Crosswalk Application Project and Packaging Tool\n" +
        "    crosswalk-app create <package-id>\t\tCreate project <package-id>\n" +
        "                         --crosswalk=<path>\tOptional path to downloaded Crosswalk\n" +
        "                         --channel=<name>\tRelease channel: stable|beta|canary\n" +
        "    crosswalk-app help\t\t\t\tDisplay usage information\n" +
        "    crosswalk-app version\t\t\tDisplay version information\n";
};

/**
 * Check whether the current instance represents a valid command line and if so,
 * get the main command.
 * @returns {String} Command string if valid, otherwise null.
 */
CommandParser.prototype.getCommand =
function() {

    var cmd = this.peekCommand();
    switch (cmd) {
    case "create":
        var packageId = this.createGetPackageId();
        return packageId !== null ? cmd : null;
    case "update":
        var version = this.updateGetVersion();
        if (version === false) {
            // Error: version could not be parsed.
            return null;
        }
        return cmd;
    case "build":
        var type = this.buildGetType();
        return type !== null ? cmd : null;
    case "help":
    case "version":
        return cmd;
    default:
        // fall through
    }

    return null;
};

/**
 * Get primary command.
 * @returns {String} One of "create", "update", "refresh", "build" or null.
 */
CommandParser.prototype.peekCommand =
function() {

    if (this._argv.length < 3) {
        return null;
    }

    var command = this._argv[2];

    if (["version", "-v", "-version", "--version"].indexOf(command) > -1) {
        return "version";
    }

    if (["help", "-h", "-help", "--help"].indexOf(command) > -1) {
        return "help";
    }

    if (["create", "update", "refresh", "build"].indexOf(command) > -1) {
        return command;
    }

    return null;
};

/**
 * Get package name when command is "create".
 * @returns {String} Package name as per Android conventions or null.
 * @see {@link http://developer.android.com/guide/topics/manifest/manifest-element.html#package}
 */
CommandParser.prototype.createGetPackageId =
function() {

    if (this._argv.length < 4) {
        return null;
    }

    var packageId = CommandParser.validatePackageId(this._argv[3], this._output);

    if (this._argv.length > 4) {
        var options = this._argv.slice(4);
        this._createOptions = Minimist(options);
    }

    return packageId;
};

/**
 * Get extra options for the create command.
 * @returns {Object} Options in name/value form, or null if there are none.
 */
CommandParser.prototype.createGetOptions =
function() {

    if (this._createOptions) {
        // Validate
        var keys = [ "crosswalk", "channel" ];
        this._createOptions = this.discardUnknownOptions(this._createOptions, keys);
    }

    return this._createOptions;
};

/**
 * Get version when command is "update".
 * @returns {String} Crosswalk version string when given and valid. Null when not given, false when invalid.
 * @see {@link https://crosswalk-project.org/documentation/downloads.html}
 */
CommandParser.prototype.updateGetVersion =
function() {

    var errormsg = "Version must be of format ab.cd.ef.gh";

    if (this._argv.length < 4) {
        return null;
    }

    var version = this._argv[3];
    var match = version.match("[0-9\\.]*");
    if (match[0] != version) {
        this._output.error(errormsg);
        return false;
    }

    var parts = version.split('.');
    if (parts.length != 4) {
        this._output.error(errormsg);
        return false;
    }

    return version;
};

/**
 * Get build type when command is "build".
 * @returns {String} One of "debug", "release", or null.
 */
CommandParser.prototype.buildGetType =
function() {

    if (this._argv.length < 3) {
        return null;
    }

    // Default to "debug" when no type given.
    if (this._argv.length < 4) {
        return "debug";
    }

    // Check build type is recognized.
    var type = this._argv[3];
    if (["debug", "release"].indexOf(type) > -1) {
        return type;
    }

    return null;
};

/**
 * Filter out unknown options from the options object.
 * @param {Object} options Options object holding name/value pairs
 * @param {String[]} knownKeys Known options to keep
 */
CommandParser.prototype.discardUnknownOptions =
function(options, knownKeys) {

    var own = Object.getOwnPropertyNames(options);
    for (var i = 0; i < own.length; i++) {
        var prop = own[i];
        if (knownKeys.indexOf(prop) < 0) {
            // Property not among knownKeys, discard.
            delete options[prop];
        }
    }

    return options;
};

/**
 * Check whether packageId conforms to the naming scheme.
 * @param {String} packageId Package ID to check
 * @param {OutputIface} output Output to write errors to
 * @returns {String} Package name as per Android conventions or null.
 * @see {@link http://developer.android.com/guide/topics/manifest/manifest-element.html#package}
 * @static
 */
CommandParser.validatePackageId =
function(packageId, output) {

    var errormsg = "Invalid package name, see http://developer.android.com/guide/topics/manifest/manifest-element.html#package";

    var match = packageId.match("[A-Za-z0-9_\\.]*");
    if (match[0] != packageId) {
        output.error(errormsg);
        return null;
    }

    // Package name must not start or end with '.'
    if (packageId[0] == '.' || packageId[packageId.length - 1] == '.') {
        output.error(errormsg);
        output.error("Name must not start or end with '.'");
        return null;
    }

    // Require 3 or more elements.
    var parts = packageId.split('.');
    if (parts.length < 3) {
        output.error(errormsg);
        output.error("Name needs to consist of 3+ elements");
        return null;
    }

    // Elements must begin with a lowercase letter
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part.match("^[a-z]")) {
            output.error("Each component of the name must start with a lowercase ascii letter");
            return null;
        }
    }

    return packageId;
};

module.exports = CommandParser;
