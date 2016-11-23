
// The node.js modules used.
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var builder = require('xmlbuilder');
var crypto = require('crypto');
var uuid = require('uuid');
var readDir = require('readdir');
var ShellJS = require("shelljs");

/**
 * Creates WixSDK object.
 * @param {String} rootPath Root path for project
 * @param {Manifest} manifest Web manifest
 * @param {OutputIface} output Output
 * @constructor
 */
function WixSDK(rootPath, manifest, output) {

    this._rootPath = rootPath;
    this._manifest = manifest;
    this._output = output;

    this._existing_ids = {};
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
 *                              'version' - product version, '0.0.0.0' by default
 *                              'is_64_bit' {Bool} - 64 bit arch. flag, 'false' by default
 */
WixSDK.prototype.generateMSI =
function(app_path, xwalk_path, meta_data, callback) {

    var output = this._output;
    var app_root_path = "approot";

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

    meta_data.product_name = meta_data.manufacturer + " " + meta_data.app_name;

    if (!meta_data.hasOwnProperty('version'))
        meta_data.version = '0.0.0.0';

    if (meta_data.hasOwnProperty("icon")) {
        meta_data.icon = this.convertPath(meta_data.icon);
    }

    function HasProductIcon() { return meta_data.hasOwnProperty('icon'); }
    function Is64Bit() { return ('is_64_bit' in meta_data) ? meta_data.is_64_bit : false; }

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
                                         : target_dir.ele('Directory', { Id: 'ProgramFilesFolder' });
    var app_root_folder = program_files_folder.ele('Directory',
                                                   { Id: 'ApplicationRootFolder', 'Name': meta_data.app_name });
    // We're putting web app files to a separate subfolder to avoid name clashes.
    var app_files_folder = app_root_folder.ele('Directory',
                                              { Id: 'ApplicationFilesFolder', 'Name': app_root_path });
    // Try to align with the in-folder extensions' directory name of Android.
    var app_relative_extensions_dir = 'xwalk-extensions';
    var app_extensions_folder = app_root_folder.ele('Directory',
                                                       { Id: 'ApplicationExtensionsFolder', 'Name': app_relative_extensions_dir });
    var program_menu_folder = target_dir.ele('Directory', { Id: 'ProgramMenuFolder' });
    var app_menu_folder = program_menu_folder.ele('Directory',
                                                  { Id: 'ApplicationProgramsFolder', 'Name': meta_data.app_name });

    var file_ids = [];

    var MakeIdFromPath = function(path) {

        if (this._existing_ids[path]) {
            return this._existing_ids[path];
        }

        var shasum = crypto.createHash('sha1');
        var id = '_' + shasum.update(path).digest('hex');

        this._existing_ids[path] = id;

        return id;

    }.bind(this);

    // To be used for cmd line arguments.
    function InQuotes(arg) {
        return "\"" + arg + "\"";
    }

    function AddFileComponent(node, base_path, relative_path) {
        var file_id = MakeIdFromPath(path.join(base_path, relative_path));
        file_ids.push(file_id);
        var component = node.ele('Component', { Id: file_id, Guid: uuid.v1() });
        var source_path = (base_path.length === 0) ? relative_path
                                                  : path.join(base_path, relative_path);
        var file = component.ele('File', { Id: file_id, Source: source_path, KeyPath: 'yes' });
        if (Is64Bit()) {
            component.att('Win64', 'yes');
            file.att('ProcessorArchitecture', 'x64');
        }

        return file_id;
    }

    var xwalk_id = AddFileComponent(app_root_folder, xwalk_path, 'xwalk.exe');
    AddFileComponent(app_root_folder, xwalk_path, 'icudtl.dat');
    AddFileComponent(app_root_folder, xwalk_path, 'natives_blob.bin');
    AddFileComponent(app_root_folder, xwalk_path, 'snapshot_blob.bin');
    AddFileComponent(app_root_folder, xwalk_path, 'VERSION');

    // Add all pak files
    ShellJS.ls(path.join(xwalk_path, "*.pak")).forEach(function (entry) {
        AddFileComponent(app_root_folder, xwalk_path, path.basename(entry));
    });

    // Add all dll files
    ShellJS.ls(path.join(xwalk_path, "*.dll")).forEach(function (entry) {
        AddFileComponent(app_root_folder, xwalk_path, path.basename(entry));
    });

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

    var locales_path = path.join(xwalk_path, 'locales', 'xwalk');
    if (!fs.existsSync(locales_path))
	locales_path = path.join(xwalk_path, 'locales');
    if (fs.existsSync(locales_path)) {
        var locales = fs.readdirSync(locales_path);
        locales.forEach(function (locale) {
            AddFileComponent(GetFolderNode('locales', app_root_folder), locales_path, locale);
        });
    } else {
        output.error("Folder 'locales' not found in " + xwalk_path);
        output.error("Missing i18n support");
    }

    // @skip_array contains absolute path of those need to be skipped, items can be
    // directory or files.
    function installFiles(source_dir_path, dest_folder_object, skip_array) {
        var app_files = readDir.readSync(source_dir_path);
        app_files.forEach(function (name) {
            var directory = path.dirname(name);
            var absPath = path.join(source_dir_path, name);
            if (skip_array.indexOf(absPath) >= 0 ||
                skip_array.indexOf(path.dirname(absPath)) >= 0)
                return;

            var node = (directory == '.') ? dest_folder_object : GetFolderNode(directory, dest_folder_object);
            AddFileComponent(node, source_dir_path, name);
        });
    }

    // Install all files with suffix .dll from @source_dir_path
    function installExtensionDlls(source_dir_path, dest_folder_object) {
        var app_files = readDir.readSync(source_dir_path);
        app_files.forEach(function (name) {
            var suffix = name.substring(name.length - ".dll".length);
            if (suffix && suffix.toLowerCase() === ".dll") {
                AddFileComponent(dest_folder_object, source_dir_path, name);
            }
        });
    }

    // Extensions are supposed to be in the source application root dir: app_path.
    // Then we copy them to the sub-directory of the installer folder:
    //     app_files_folder/xwalk-extensions
    // So, if we still fully copy the source application root directory, all the
    // extensions will be duplicated.
    // Extensions can be divided by categories in seperate directories.
    this._manifest.extensions.forEach(function(extDir) {
        installExtensionDlls(extDir, app_extensions_folder);
        if (path.normalize(path.dirname(extDir)) == path.normalize(app_path)) {
            extensions_relative_dir.push(path.relative(app_path, extDir));
        }
    }.bind(this));

    // Skip in-folder extensions copying to avoid duplication.
    installFiles(app_path, app_files_folder, this._manifest.extensions);

    var program_menu_folder_ref = product.ele('DirectoryRef', { Id: 'ApplicationProgramsFolder' });
    var component = program_menu_folder_ref.ele('Component', { Id: 'ApplicationShortcut', Guid: uuid.v1() });
    var registry_entries_component;
    if (meta_data.googleApiKeys) {
        var registry_entries_ref = product.ele('DirectoryRef', { Id: 'TARGETDIR' });
        registry_entries_component = registry_entries_ref.ele('Component', { Id: 'RegistryEntries', Guid: uuid.v1() });
    }

    var cmd_line_args = InQuotes(path.join(app_root_path, 'manifest.json'));
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
    if (this._manifest.extensions.length > 0) {
        cmd_line_args += ' --external-extensions-path=' + app_relative_extensions_dir;
    }
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
    
    shortcut.ele('ShortcutProperty', {
        Key: 'System.AppUserModel.ID',
        Value: meta_data.product,
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

    if (meta_data.googleApiKeys) {

        var registry_entries = registry_entries_component.ele('RegistryKey', {
            Root: 'HKCU',
            Key: 'Software\\' + meta_data.manufacturer + '\\' + meta_data.product,
            Action: 'createAndRemoveOnUninstall'
        });
        registry_entries.ele('RegistryValue', {
            Type: 'string',
            Name: 'GOOGLE_API_KEY',
            Value: meta_data.googleApiKeys.GOOGLE_API_KEY,
            KeyPath: 'yes'
        });
        registry_entries.ele('RegistryValue', {
            Type: 'string',
            Name: 'GOOGLE_DEFAULT_CLIENT_ID',
            Value: meta_data.googleApiKeys.GOOGLE_DEFAULT_CLIENT_ID
        });
        registry_entries.ele('RegistryValue', {
            Type: 'string',
            Name: 'GOOGLE_DEFAULT_CLIENT_SECRET',
            Value: meta_data.googleApiKeys.GOOGLE_DEFAULT_CLIENT_SECRET
        });
    }

    var feature = product.ele('Feature', { Id: 'MainApplication', Level: '1' });
    file_ids.forEach(function (file_id) { feature.ele('ComponentRef', { Id: file_id }); });
    feature.ele('ComponentRef', { Id: "ApplicationShortcut" });
    if (meta_data.googleApiKeys) {
        feature.ele('ComponentRef', { Id: "RegistryEntries" });
    }

    var xml_str = root.end({ pretty: true });
    var basename = meta_data.product + "-" + meta_data.version;
    var wxsPath = path.join(this._rootPath, basename + '.wxs');
    fs.writeFileSync(wxsPath, xml_str);
    this.runWix(InQuotes(basename), wxsPath, function(success) {
        if (success) {
            // Pass back built package
            meta_data.msi = path.resolve(basename + ".msi");
            // Only delete on success, for debugging reasons.
            ShellJS.rm("-f", basename + ".wixobj");
            ShellJS.rm("-f", basename + ".wixpdb");
        }
        callback(success);
    });
};

WixSDK.prototype.runWix =
function(basename, wxsPath, callback) {

    var candle = "candle -v " + wxsPath;
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
