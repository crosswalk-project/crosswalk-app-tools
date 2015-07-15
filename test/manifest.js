// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

var Manifest = require("../src/Manifest.js");
var Util = require("../test-util/Util.js");

var _output = require("../src/TerminalOutput").getInstance();



function produceManifest(version) {

    var path = Util.createTmpFile();
    var content = JSON.stringify({
        "crosswalk_app_version": version
    });
    FS.writeFileSync(path, content);

    return path;
}

function consumeManifest(path) {

    var manifest = new Manifest(_output, path);
    var appVersion = manifest.appVersion;
    ShellJS.rm("-f", path);

    return appVersion;
}

exports.tests = {

    appVersion: function(test) {

        var version;
        var path;

        test.expect(9);

        version = "2";
        path = produceManifest(version);
        test.equal(version, consumeManifest(path));

        version = "2.2";
        path = produceManifest(version);
        test.equal(version, consumeManifest(path));

        version = "2.2.2";
        path = produceManifest(version);
        test.equal(version, consumeManifest(path));

        version = "2.";
        path = produceManifest(version);
        test.equal(false, version == consumeManifest(path));

        version = "2.2.";
        path = produceManifest(version);
        test.equal(false, version == consumeManifest(path));

        version = "2.2.2.";
        path = produceManifest(version);
        test.equal(false, version == consumeManifest(path));

        version = "3333";
        path = produceManifest(version);
        test.equal(false, version == consumeManifest(path));

        version = "333.333";
        path = produceManifest(version);
        test.equal(false, version == consumeManifest(path));

        version = "33.333.333";
        path = produceManifest(version);
        test.equal(false, version == consumeManifest(path));

        test.done();
    },

    targetPlatforms: function(test) {

        test.expect(1);

        var path = Util.createTmpFile();
        var content = JSON.stringify({
            "crosswalk_app_version": "1",
            "crosswalk_target_platforms": "foo"
        });
        FS.writeFileSync(path, content);

        var manifest = new Manifest(_output, path);
        test.equal(manifest.targetPlatforms, "foo");

        ShellJS.rm("-f", path);
        test.done();
    },

    windowsUpdateId: function(test) {

        test.expect(1);

        var path1 = Util.createTmpFile();
        Manifest.create(path1);
        var m1 = new Manifest(_output, path1);
        ShellJS.rm("-f", path1);

        var path2 = Util.createTmpFile();
        Manifest.create(path2);
        var m2 = new Manifest(_output, path2);
        ShellJS.rm("-f", path2);

        test.equal(false, m1.windowsUpdateId === m2.windowsUpdateId);
        test.done();
    },

    windowsVendor: function(test) {

        test.expect(1);

        var path3 = Util.createTmpFile();
        Manifest.create(path3);
        var m3 = new Manifest(_output, path3);
        ShellJS.rm("-f", path3);

        test.equal(typeof m3.windowsVendor === "string", true);
        test.done();
    }
};
