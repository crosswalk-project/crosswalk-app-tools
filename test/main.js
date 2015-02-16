// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");
var CommandParser = require("../src/CommandParser");

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").getInstance().setSilentConsole(true);
var _application = require("../src/Main");
var _output = _application.output;

exports.tests = {

    main: function(test) {

        test.expect(0);

        // Just call main without args, this should display help.
        // As long as no exception hits us we're good.
        _application.run();

        test.done();
    },

    create1: function(test) {

        test.expect(1);

        // Good test.
        // MkTemp creates temp dir in working dir, so cd tmp first.
        ShellJS.pushd(OS.tmpdir());

        var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
        _output.info("Tempdir: " + tmpdir);
        ShellJS.pushd(tmpdir);

        _application.create("com.example.Foo", function(success) {

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
        _output.info("Tempdir: " + tmpdir);
        ShellJS.pushd(tmpdir);

        // Malformed name, fail.
        _application.create("Foo", function(success) {

            test.equal(success, false);

            ShellJS.popd();
            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    },

    build: function(test) {

        test.expect(1);

        // Create
        // MkTemp creates temp dir in working dir, so cd tmp first.
        ShellJS.pushd(OS.tmpdir());

        var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
        _output.info("Tempdir: " + tmpdir);
        ShellJS.pushd(tmpdir);

        _application.create("com.example.Foo", function(success) {

            if (success) {

                // Build
                ShellJS.pushd("com.example.Foo");
                _application.build("debug", function(success) {

                    test.equal(success, true);
                    test.done();

                    ShellJS.popd();
                    ShellJS.popd();
                    ShellJS.popd();
                    ShellJS.rm("-rf", tmpdir);
                });
            } else {
                test.done();
            }
        });
    },

    printHelp: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var parser = new CommandParser(_application.output, process.argv);
        _application.printHelp(parser);

        test.done();
    },

    printVersion: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        _application.printVersion();

        test.done();
    }
};
