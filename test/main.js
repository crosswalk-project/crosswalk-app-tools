// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");
// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(true);
var CommandParser = require("../src/CommandParser");
var Console = require("../src/Console");
var MainTest = require("../src/main.js").test;

exports.tests = {

    create1: function(test) {

        test.expect(1);

        // Good test.
        // MkTemp creates temp dir in working dir, so cd tmp first.
        ShellJS.pushd(OS.tmpdir());

        var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
        Console.log("Tempdir: " + tmpdir);
        ShellJS.pushd(tmpdir);

        MainTest.create("com.example.Foo", function(success) {

            test.equal(success, true);

            ShellJS.popd();
            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    },

    create2: function(test) {

        test.expect(1);

        // Bad test.
        // MkTemp creates temp dir in working dir, so cd tmp first.
        ShellJS.pushd(OS.tmpdir());

        var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
        Console.log("Tempdir: " + tmpdir);
        ShellJS.pushd(tmpdir);

        // Malformed name, fail.
        MainTest.create("Foo", function(success) {

            test.equal(success, false);

            ShellJS.popd();
            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    },

    printHelp: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var parser = new CommandParser(process.argv);
        MainTest.printHelp(parser);

        test.done();
    },

    printVersion: function(test) {
    
        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        MainTest.printVersion();

        test.done();
    }
};
