// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var ShellJS = require("shelljs");

var Application = require("../src/Application");
var CommandParser = require("../src/CommandParser");
var TerminalOutput = require("../src/TerminalOutput");
var Util = require("../test-util/Util.js");

var _packageId = "com.example.foo";

exports.tests = {

    main: function(test) {

        test.expect(1);

        // Just call main without args, this should display help.
        // Need to strip extra command-line args though, so the
        // command parser is not confused.
        process.argv = process.argv.slice(0, 2);

        // As long as no exception hits us we're good.
        var app = require("../src/Main");
        app.run(function (errno) {
            test.equal(errno, 0);
            test.done();
        });
    },

    check0: function(test) {

        test.expect(1);

        // Good test.
        // Run check without platforms
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../src/Main");
        app.check([], TerminalOutput.getInstance(), function(errno) {

            test.equal(errno, 0);

            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    },

    check1: function(test) {

        test.expect(1);

        // Good test.
        // Run check "android"
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../src/Main");
        app.check(["android"], TerminalOutput.getInstance(), function(errno) {

            test.equal(errno, 0);

            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    },

    listPlatforms: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var app = require("../src/Main");
        app.listPlatforms(TerminalOutput.getInstance());

        test.done();
    },

    printHelp: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var app = require("../src/Main");
        var parser = new CommandParser(TerminalOutput.getInstance(), process.argv);
        app.printHelp(parser, TerminalOutput.getInstance());

        test.done();
    },

    printVersion: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var app = require("../src/Main");
        app.printVersion(TerminalOutput.getInstance());

        test.done();
    }
};
