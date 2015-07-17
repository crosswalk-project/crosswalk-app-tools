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
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(version, consumeManifest(path).appVersion);

        version = "2.2";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(version, consumeManifest(path).appVersion);

        version = "2.2.2";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(version, consumeManifest(path).appVersion);

        version = "2.";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "2.2.";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "2.2.2.";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "3333";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "333.333";
        path = produceManifest({"crosswalk_app_version": version});
        test.equal(false, version == consumeManifest(path).appVersion);

        version = "33.333.333";
        path = produceManifest({"crosswalk_app_version": version});
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

    targetPlatforms: function(test) {

        test.expect(2);

        var path = produceManifest({"crosswalk_target_platforms": "android"});

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

        test.expect(1);

        var path3 = produceManifest();
        var m3 = consumeManifest(path3);

        test.equal(typeof m3.windowsVendor === "string", true);
        test.done();
    }
};
