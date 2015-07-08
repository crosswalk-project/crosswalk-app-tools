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

        test.expect(6);

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

        test.done();
    }
};
