// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var ShellJS = require("shelljs");

var Application = require("../src/Application");
var CommandParser = require("../src/CommandParser");
var Util = require("./util/Util.js");

// Let's see progress.
require("../src/Config").getInstance().setSilentConsole(false);


exports.tests = {

    main: function(test) {

        test.expect(0);

        // Just call main without args, this should display help.
        // As long as no exception hits us we're good.
        var app = require("../src/Main");
        app.run();

        test.done();
    },

    create: function(test) {

        test.expect(1);
        
        // Good test.
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../src/Main");
        Application.call(app, tmpdir, "com.example.foo");
        app.create(null, function(success) {

            test.equal(success, true);

            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    },

    build: function(test) {

        test.expect(1);

        // Create
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../src/Main");
        Application.call(app, tmpdir, "com.example.foo");
        app.create(null, function(success) {

            if (success) {

                // Build
                ShellJS.pushd("com.example.foo");
                app.build("debug", function(success) {

                    test.equal(success, true);
                    test.done();

                    ShellJS.popd();
                    ShellJS.popd();
                    ShellJS.rm("-rf", tmpdir);
                });
            } else {
                test.done();
            }
        });
    },

    update: function(test) {

        test.expect(1);

        // Good test.
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../src/Main");
        Application.call(app, tmpdir, "com.example.foo");
        // Create
        app.create(null, function(success) {

            if (success) {
                // Update
                ShellJS.pushd("com.example.foo");
                app.update("stable", function(success) {

                    if (success) {
                        // Build
                        app.build("debug", function(success) {

                            test.equal(success, true);
                            ShellJS.popd();
                            ShellJS.popd();
                            ShellJS.rm("-rf", tmpdir);
                            test.done();
                        });
                    } else {
                        ShellJS.popd();
                        ShellJS.popd();
                        ShellJS.rm("-rf", tmpdir);
                        test.done();
                    }
                });
            } else {
                ShellJS.popd();
                ShellJS.popd();
                ShellJS.rm("-rf", tmpdir);
                test.done();
            }
        });
    },

    printHelp: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var app = require("../src/Main");
        var parser = new CommandParser(app.output, process.argv);
        app.printHelp(parser);

        test.done();
    },

    printVersion: function(test) {

        // Prints to stdout, so just run the code to see if it breaks.
        test.expect(0);

        var app = require("../src/Main");
        app.printVersion();

        test.done();
    }
};
