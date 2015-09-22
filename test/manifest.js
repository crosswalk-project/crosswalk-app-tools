// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

var Manifest = require("../src/Manifest.js");
var Util = require("../test-util/Util.js");

var _output = require("../src/TerminalOutput").getInstance();



function produceManifest(fields) {

    var path = Util.createTmpFile();
    Manifest.create(path, "com.example.foo");

    if (fields) {
        // Override default values
        var buffer = FS.readFileSync(path, {"encoding": "utf8"});
        var json = JSON.parse(buffer);
        for (var prop in fields) {
            json[prop] = fields[prop];
        }
        // Write back
        buffer = JSON.stringify(json);
        FS.writeFileSync(path, buffer);
    }

    return path;
}

function consumeManifest(path) {

    var manifest = new Manifest(_output, path);
    ShellJS.rm("-f", path);

    return manifest;
}

exports.tests = {

    appVersion: function(test) {

        var version;
        var path;

        test.expect(9);

        version = "2";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(version, consumeManifest(path).appVersion);

        version = "2.2";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(version, consumeManifest(path).appVersion);

        version = "2.2.2";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(version, consumeManifest(path).appVersion);

        version = "2.";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "2.2.";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "2.2.2.";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "3333";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "333.333";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "33.333.333";
        path = produceManifest({"xwalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        test.done();
    },

    name: function(test) {

        test.expect(2);

        var path = produceManifest();

        // read
        var manifest = new Manifest(_output, path);
        test.equal(manifest.name, "com.example.foo");

        // write
        manifest.name = "foofoo";

        // read back
        manifest = consumeManifest(path);
        test.equal(manifest.name, "foofoo");

        test.done();
    },

    shortName: function(test) {

        test.expect(2);

        var path = produceManifest();

        // read
        var manifest = new Manifest(_output, path);
        test.equal(manifest.shortName, "foo");

        // write
        manifest.shortName = "foofoo";

        // read back
        manifest = consumeManifest(path);
        test.equal(manifest.shortName, "foofoo");

        test.done();
    },

    display: function(test) {

        test.expect(3);

        // Default to "false"
        var path = produceManifest();
        var manifest = consumeManifest(path);
        test.equal(manifest.display, "standalone");

        // Test reading "fullscreen"
        path = produceManifest({"display": "fullscreen"});
        manifest = consumeManifest(path);
        test.equal(manifest.display, "fullscreen");

        // Test reading bogus value "foo", default to "standalone"
        path = produceManifest({"display": "foo"});
        manifest = consumeManifest(path);
        test.equal(manifest.display, "standalone");

        test.done();
    },

    icons: function(test) {

        test.expect(3);

        // Default to empty
        var path = produceManifest();
        var manifest = consumeManifest(path);
        // Default icon, so length 1
        test.equal(manifest.icons.length, 1);

        // Test reading "fullscreen"
        var icon = {
            src: "icon.png",
            sizes: "32x32"
        };
        path = produceManifest({"icons": [ icon ]});
        manifest = consumeManifest(path);
        test.equal(manifest.icons[0].src, "icon.png");
        test.equal(manifest.icons[0].sizes, "32x32");

        test.done();
    },

    startUrl: function(test) {

        test.expect(2);

        var path = produceManifest();

        // read default
        var manifest = consumeManifest(path);
        test.equal(manifest.startUrl, "index.html");

        // Test reading "start.html"
        path = produceManifest({"start_url": "start.html"});
        manifest = consumeManifest(path);
        test.equal(manifest.startUrl, "start.html");

        test.done();
    },

    commandLine: function(test) {

        test.expect(2);

        // default
        var path = produceManifest();
        var manifest = consumeManifest(path);
        test.equal(manifest.commandLine, null);

        // custom value
        path = produceManifest({"xwalk_command_line": "foo"});
        manifest = consumeManifest(path);
        test.equal(manifest.commandLine, "foo");

        test.done();
    },

    packageId: function(test) {

        test.expect(2);

        var path = produceManifest({"xwalk_package_id": "com.example.foo"});

        // read
        var manifest = consumeManifest(path);
        test.equal(manifest.packageId, "com.example.foo");

        // bad case
        path = produceManifest({"xwalk_package_id": "foo"});
        try {
            manifest = new Manifest(_output, path);
        } catch (error) {
            ShellJS.rm("-rf", path);
            // Just make sure we pass by here.
            test.equal(true, true);
        }

        test.done();
    },

    targetPlatforms: function(test) {

        test.expect(2);

        var path = produceManifest({"xwalk_target_platforms": "android"});

        // read
        var manifest = new Manifest(_output, path);
        test.equal(manifest.targetPlatforms, "android");

        // write
        manifest.targetPlatforms = "windows";

        // read back
        manifest = consumeManifest(path);
        test.equal(manifest.targetPlatforms, "windows");

        test.done();
    },

    androidAnimatableView: function(test) {

        test.expect(2);

        // Default to "false"
        var path = produceManifest();
        var manifest = consumeManifest(path);
        test.equal(manifest.androidAnimatableView, false);

        // Test reading "true"
        path = produceManifest({"xwalk_android_animatable_view": true});
        manifest = consumeManifest(path);
        test.equal(manifest.androidAnimatableView, true);

        test.done();
    },

    androidKeepScreenOn: function(test) {

        test.expect(2);

        // Default to "false"
        var path = produceManifest();
        var manifest = consumeManifest(path);
        test.equal(manifest.androidKeepScreenOn, false);

        // Test reading "true"
        path = produceManifest({"xwalk_android_keep_screen_on": true});
        manifest = consumeManifest(path);
        test.equal(manifest.androidKeepScreenOn, true);

        test.done();
    },

    androidWebp: function(test) {

        test.expect(2);

        // Default to "false"
        var path = produceManifest();
        var manifest = consumeManifest(path);
        test.equal(!manifest.androidWebp, true);

        // Test reading "true"
        path = produceManifest({"xwalk_android_webp": "80 80 100"});
        manifest = consumeManifest(path);
        test.equal(manifest.androidWebp, "80 80 100");

        test.done();
    },

    windowsUpdateId: function(test) {

        test.expect(1);

        var path1 = produceManifest();
        var m1 = consumeManifest(path1);

        var path2 = produceManifest();
        var m2 = consumeManifest(path2);

        test.equal(false, m1.windowsUpdateId === m2.windowsUpdateId);
        test.done();
    },

    windowsVendor: function(test) {

        test.expect(2);

        var path1 = produceManifest();
        var m1 = consumeManifest(path1);
        test.equal(m1.windowsVendor, null);

        var path2 = produceManifest({"xwalk_windows_vendor": "foo"});
        var m2 = consumeManifest(path2);
        test.equal(m2.windowsVendor, "foo");

        test.done();
    }
};
