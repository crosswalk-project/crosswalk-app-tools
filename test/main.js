// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(true);
var Console = require("../src/Console");
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

exports.tests = {

    create: function(test) {

        test.expect(1);

        // MkTemp creates temp dir in working dir, so cd tmp first.
        ShellJS.pushd(OS.tmpdir());

        var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
        Console.log("Tempdir: " + tmpdir);
        ShellJS.pushd(tmpdir);

        require("../src/main.js").test.create("com.example.Foo", function(success) {

            test.equal(success, true);

            ShellJS.popd();
            ShellJS.popd();

            test.done();
        });
    }
};
