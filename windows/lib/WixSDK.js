
// The node.js modules used.
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var builder = require('xmlbuilder');
var crypto = require('crypto');
var uuid = require('node-uuid');
var readDir = require('readdir');
var ShellJS = require("shelljs");

/**
 * Creates WixSDK object.
 * @param {Manifest} manifest Web manifest
 * @param {OutputIface} output Output
 * @constructor
 */
function WixSDK(manifest, output) {

    this._manifest = manifest;
    this._output = output;
}

/**
 * The WiX toolkit works with forward slashes. Convert input paths.
 * @param {String} path Input path
 * @returns {String} Converted output path.
 */
WixSDK.prototype.convertPath =
function(path) {

    return path.replace(/\\\\/g, "/").replace(/\\/g, "/");
};

/**
 * This function generates Windows installer file (.msi) for the given Crosswalk-based application
 *
 * @param {String} app_path Path to the folder containing the application manifest.json file
 * @param {String} xwalk_path Path to the folder containing the Crosswalk build output (e.g. out/Release)
 * @param {Object} meta_data The data used for .msi generation.
 *                           Mandatory fields:
 *                              'app_name' - application name
 *                              'upgrade_id' - package upgrade Id (GUID)
 *                              'manufacturer' - product manufacturer
 *                           Optional fields:
 *                              'icon' - path to the icon to be used for shortcut and in the installed program list
 *                              'product_name' - product name, application name is used by default
 *                              'version' - product version, '0.0.0.0' by default
 *                              'is_64_bit' {Bool} - 64 bit arch. flag, 'false' by default
 *                              'extensions' - path to the Crosswalk C++ extensions to be used by the app
 */
WixSDK.prototype.generateMSI =
function(app_path, xwalk_path, meta_data, callback) {

    var output = this._output;

    if (app_path) {
        app_path = this.convertPath(app_path);
    } else {
        output.error("Path to the application is missing");
        callback(false);
        return;
    }

    if (xwalk_path) {
        xwalk_path = this.convertPath(xwalk_path);
    } else {
        output.error("Path to xwalk binaries is missing");
        callback(false);
        return;
    }

    if (!meta_data) {
        output.error("No meta data object is provided");
        callback(false);
        return;
    }

    // Check the mandatory properties.
    if (!meta_data.hasOwnProperty('app_name')) {
        output.error("Application name must be provided");
        callback(false);
        return;
    }

    if (!meta_data.hasOwnProperty('upgrade_id')) {
        output.error("Package upgrade ID must be provided");
        callback(false);
        return;
    }

    if (!meta_data.hasOwnProperty('manufacturer')) {
        output.error("Manufacturer must be provided");
        callback(false);
        return;
    }

    if (!meta_data.hasOwnProperty('product_name'))
        meta_data.product_name = meta_data.app_name;

    if (!meta_data.hasOwnProperty('version'))
        meta_data.version = '0.0.0.0';

    if (meta_data.hasOwnProperty("icon")) {
        meta_data.icon = this.convertPath(meta_data.icon);
    }

    function HasProductIcon() { return meta_data.hasOwnProperty('icon'); }
    function Is64Bit() { return ('is_64_bit' in meta_data) ? meta_data.is_64_bit : false; }
    function HasExtensions() { return meta_data.hasOwnProperty('extensions'); }

    var root = builder.create('Wix').att('xmlns', 'http://schemas.microsoft.com/wix/2006/wi');

    var product = root.ele('Product', {
        'Id': '*',
        'Name': meta_data.product_name,
        'UpgradeCode': meta_data.upgrade_id,
        'Version': meta_data.version,
        'Manufacturer': meta_data.manufacturer,
        'Language': '1033'
    });

    var package = product.ele('Package', { InstallerVersion: '300', 'Compressed': 'yes' });
    if (Is64Bit())
        package.att('Platform', 'x64');

    product.ele('Media', { Id: '1', 'Cabinet': 'main.cab', 'EmbedCab': 'yes' });

    product.ele('Property', { Id: 'ARPNOREPAIR', 'Value': '1' });
    product.ele('Property', { Id: 'ARPNOMODIFY', 'Value': '1' });

    if (HasProductIcon()) {
        product.ele('Icon', { Id: 'ProductIcon', SourceFile: meta_data.icon });
        product.ele('Property', { Id: 'ARPPRODUCTICON', 'Value': 'ProductIcon' });
    }

    var target_dir = product.ele('Directory', { 'Id': 'TARGETDIR', 'Name': 'SourceDir' });

    var program_files_folder = Is64Bit() ? target_dir.ele('Directory', { Id: 'ProgramFiles64Folder' })
                                         : target_dir.ele('Directory', { Id: 'ProgramFilesFolder' })
    var app_root_folder = program_files_folder.ele('Directory',
                                                   { Id: 'ApplicationRootFolder', 'Name': meta_data.app_name });
    // We're putting web app files to a separate subfolder to avoid name clashes.
    var app_files_folder = app_root_folder.ele('Directory',
                                              { Id: 'ApplicationFilesFolder', 'Name': meta_data.app_name });
    if (HasExtensions()) {
        var app_extensions_folder = app_root_folder.ele('Directory',
                                                       { Id: 'ApplicationExtensionsFolder', 'Name': 'extensions' });
    }

    var program_menu_folder = target_dir.ele('Directory', { Id: 'ProgramMenuFolder' });
    var app_menu_folder = program_menu_folder.ele('Directory',
                                                  { Id: 'ApplicationProgramsFolder', 'Name': meta_data.app_name });

    var file_ids = [];

    function MakeIdFromPath(path) {
        var shasum = crypto.createHash('sha1');
        existing_ids = {}

        var id = '_' + shasum.update(path).digest('hex');
        while (existing_ids.hasOwnProperty(id) && existing_ids[id] != path)
            id = '_' + shasum.update(id).digest('hex');

        existing_ids[id] = path;

        return id;
    }

    // To be used for cmd line arguments.
    function InQuotes(arg) {
        return "\"" + arg + "\"";
    }

    function AddFileComponent(node, base_path, relative_path) {
        var file_id = MakeIdFromPath(relative_path);
        file_ids.push(file_id);
        var component = node.ele('Component', { Id: file_id, Guid: uuid.v1() });
        var source_path = (base_path.length == 0) ? relative_path
                                                  : path.join(base_path, relative_path);
        var file = component.ele('File', { Id: file_id, Source: source_path, KeyPath: 'yes' });
        if (Is64Bit()) {
            component.att('Win64', 'yes');
            file.att('ProcessorArchitecture', 'x64');
        }

        return file_id;
    }

    var xwalk_id = AddFileComponent(app_root_folder, xwalk_path, 'xwalk.exe');
    AddFileComponent(app_root_folder, xwalk_path, 'xwalk.pak');
    AddFileComponent(app_root_folder, xwalk_path, 'icudtl.dat');
    AddFileComponent(app_root_folder, xwalk_path, 'natives_blob.bin');
    AddFileComponent(app_root_folder, xwalk_path, 'snapshot_blob.bin');
    AddFileComponent(app_root_folder, xwalk_path, 'libEGL.dll');
    AddFileComponent(app_root_folder, xwalk_path, 'libGLESv2.dll');
    AddFileComponent(app_root_folder, xwalk_path, 'osmesa.dll');

    var subfolder_map = {};

    function GetFolderNode(subfolder, root) {
        if (subfolder in subfolder_map)
            return subfolder_map[subfolder];

        var node;
        var split_index = subfolder.lastIndexOf('/');
        if (split_index == -1) {
            node = root.ele('Directory', { Id: MakeIdFromPath(subfolder), Name: subfolder });
        } else {
            var parent = subfolder.substring(0, split_index);
            var foder_name = subfolder.substring(split_index + 1);
            node = GetFolderNode(parent, root).ele('Directory', { Id: MakeIdFromPath(subfolder), Name: foder_name });
        }

        subfolder_map[subfolder] = node;
        return node;
    }

    var locales_path = path.join(xwalk_path, 'locales');
    if (fs.existsSync(locales_path)) {
        var locales = fs.readdirSync(locales_path);
        locales.forEach(function (locale) {
            AddFileComponent(GetFolderNode('locales', app_root_folder), locales_path, locale);
        });
    } else {
        // TODO maybe error or warning
    }

    function installFiles(source_dir_path, dest_folder_object) {
        var app_files = readDir.readSync(source_dir_path);
        app_files.forEach(function (name) {
            var directory = path.dirname(name);
            var node = (directory == '.') ? dest_folder_object : GetFolderNode(directory, dest_folder_object);
            AddFileComponent(node, source_dir_path, name);
        });
    }

    installFiles(app_path, app_files_folder);
    if (HasExtensions())
        installFiles(meta_data.extensions, app_extensions_folder);

    var program_menu_folder_ref = product.ele('DirectoryRef', { Id: 'ApplicationProgramsFolder' });
    var component = program_menu_folder_ref.ele('Component', { Id: 'ApplicationShortcut', Guid: uuid.v1() });

    var cmd_line_args = InQuotes(path.join(meta_data.app_name, 'manifest.json'));
    if (this._manifest.commandLine) {
        var manifest_args = this._manifest.commandLine.split(" ").reduce(function (acc, val) {
            // Multiple adjacent whitespaces split to empty elements.
            if (val)
                return acc + ' "' + val + '"';
            else
                return acc;
        }, "");
        cmd_line_args += manifest_args;
    }
    if (HasExtensions())
        cmd_line_args += ' --external-extensions-path=extensions';
    if (meta_data.configId === "debug") {
        cmd_line_args += " --enable-inspector";
    }

    var shortcut = component.ele('Shortcut', {
        Id: 'ApplicationStartMenuShortcut',
        Name: meta_data.app_name,
       // Description: 'blah blah',
        Target: '[#' + xwalk_id + ']',
        Arguments: cmd_line_args,
        WorkingDirectory: 'ApplicationRootFolder'
    });
    if (HasProductIcon())
        shortcut.att('Icon', 'ProductIcon');

    component.ele('RemoveFolder', {
        Id: 'ApplicationProgramsFolder',
        On: 'uninstall'
    });
    component.ele('RegistryValue', {
        Root: 'HKCU',
        Key: 'Software\\' + meta_data.manufacturer + '\\' + meta_data.product,
        Name: 'installed',
        Type: 'integer',
        Value: '1',
        KeyPath: 'yes'
    });

    var feature = product.ele('Feature', { Id: 'MainApplication', Level: '1' });
    file_ids.forEach(function (file_id) { feature.ele('ComponentRef', { Id: file_id }); })
    feature.ele('ComponentRef', { Id: "ApplicationShortcut" });

    var xml_str = root.end({ pretty: true });
    var basename = meta_data.product + "-" + meta_data.version;
    fs.writeFileSync(basename + '.wxs', xml_str);
    this.runWix(InQuotes(basename), function(success) {
        if (success) {
            // Pass back built package
            meta_data.msi = path.resolve(basename + ".msi");
            // Only delete on success, for debugging reasons.
            ShellJS.rm("-f", basename + ".wxs");
            ShellJS.rm("-f", basename + ".wixobj");
            ShellJS.rm("-f", basename + ".wixpdb");
        }
        callback(success);
    });
};

WixSDK.prototype.runWix =
function(basename, callback) {

    var candle = "candle -v " + basename + ".wxs";
    this._output.info("Running '" + candle + "'");
    var child = child_process.exec(candle);

    child.stdout.on("data", function(data) {
        this.onData(data);
    }.bind(this));

    child.stderr.on("data", function(data) {
        this._output.warning(data);
    }.bind(this));

    child.on("exit", function(code, signal) {
        if (code) {
            this._output.error("Unhandled error " + code);
            callback(false);
        } else {
            this.runWixLight(basename, callback);
        }
        return;
    }.bind(this));
};

WixSDK.prototype.runWixLight =
function(basename, callback) {

    var light = "light -v " + basename + ".wixobj";
    this._output.info("Running '" + light + "'");
    var child = child_process.exec(light);

    child.stdout.on("data", function(data) {
        this.onData(data);
    }.bind(this));

    child.stderr.on("data", function(data) {
        this._output.warning(data);
    }.bind(this));

    child.on("exit", function(code, signal) {
        if (code) {
            this._output.error("Unhandled error " + code);
        }
        callback(code === 0);
        return;
    }.bind(this));
};

WixSDK.prototype.onData =
function(data) {

};

module.exports = WixSDK;
