// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var Minimist = require("minimist");
var ShellJS = require("shelljs");

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
}

/**
 * Get program usage information.
 * @returns {String} Usage information string.
 */
CommandParser.prototype.help =
function() {
    return "" +
"\n" +
"Crosswalk Project Application Packaging Tool\n" +
"\n" +
"    crosswalk-app create <package-id>           Create project <package-id>\n" +
"                  --platforms=<target>          Optional, e.g. \"windows\"\n" +
"\n" +
"    crosswalk-app build [release|debug] [<dir>] Build project to create packages\n" +
"                                                Defaults to \"debug\" when not given\n" +
"                                                Tries to build in current dir by default\n" +
"\n" +
"    crosswalk-app update [<version>] [<dir>]    Update Crosswalk to latest in named\n" +
"                                                channel, or specific version\n" +
"                                                Version is \"stable\" when not given" +
"\n" +
"    crosswalk-app platforms                     List available target platforms\n" +
"\n" +
"    crosswalk-app help                          Display usage information\n" +
"\n" +
"    crosswalk-app version                       Display version information\n";
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
        if (!version) {
            // Error: version could not be parsed.
            return null;
        }
        return cmd;
    case "build":
        var type = this.buildGetType();
        return type !== null ? cmd : null;
    case "platforms":
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

    if (["create", "update", "refresh", "build", "platforms"].indexOf(command) > -1) {
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

    return packageId;
};

/**
 * Get version when command is "update".
 * @returns {String} Crosswalk version string when given and valid. Null when not given, false when invalid.
 * @see {@link https://crosswalk-project.org/documentation/downloads.html}
 */
CommandParser.prototype.updateGetVersion =
function() {

    // argv is filled like this:
    // node crosswalk-app update [version] [dir]
    // So argv[3] is either version or dir.

    if (this._argv.length < 4) {
        return "stable";
    }

    var version = this._argv[3];
    if (CommandParser.validateVersion(version, null)) {
        return version;
    }

    return null;
};

// FIXME require node 0.12 and use Path.isAbsolute
CommandParser.prototype.isAbsolute =
function(path) {

    if (Path.sep === "/" &&
        path[0] === Path.sep) {
        return true;
    }

    // Windows
    return path.match(/^[a-zA-z]:/) !== null;
};

/**
 * Get dir when command is "update". Defaults to current dir.
 */
CommandParser.prototype.updateGetDir =
function() {

    // argv is filled like this:
    // node crosswalk-app update [version] [dir]
    // Dir can only be specified if version is given, though,
    // no guessing around here.

    if (this._argv.length < 5) {
        // Dir not given.
        return process.cwd();
    }

    var path = this._argv[4];
    if (this.isAbsolute(path)) {
        return Path.resolve(Path.normalize(path));
    }

    return Path.resolve(Path.normalize(Path.join(process.cwd(), path)));
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
    } else {
        return "debug";
    }

    return null;
};

/**
 * Get project directory to build
 * @returns {String} Absolute path to project directory
 */
CommandParser.prototype.buildGetDir =
function() {

    // Default to current dir when no type given.
    if (this._argv.length < 4) {
        return Path.resolve(".");
    }

    if (this._argv.length === 4) {
        if (["debug", "release"].indexOf(this._argv[3]) > -1) {
            return Path.resolve(".");
        } else {
            return Path.resolve(this._argv[3]);
        }
    }

    if (this._argv.length > 4) {
        return Path.resolve(this._argv[4]);
    }

    return null;
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

/**
 * Validate crosswalk version.
 * @param {String} version Version string
 * @param {OutputIface} [output]
 * @returns {Boolean} true if valid, otherwise false.
 */
CommandParser.validateVersion =
function(version, output) {

    var errormsg = "Version must be channel 'stable', 'beta', 'canary', or format ab.cd.ef.gh";

    // Recognise channel name for version
    if (["beta", "canary", "stable"].indexOf(version) > -1) {
        return true;
    }

    var match = version.match("[0-9\\.]*");
    if (match[0] != version) {
        if (output)
            output.error(errormsg);
        return false;
    }

    var parts = version.split('.');
    if (parts.length != 4) {
        if (output)
            output.error(errormsg);
        return false;
    }

    return true;
};

module.exports = CommandParser;
