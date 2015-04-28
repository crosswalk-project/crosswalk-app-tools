// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');

var ShellJS = require("shelljs");

var AndroidDependencies = require("../lib/AndroidDependencies");
var Util = require("../../test-util/Util.js");

var _output = require("../../src/TerminalOutput").getInstance();


exports.tests = {

    pickLatest1: function(test) {

        test.expect(1);

        var app = Util.createTmpApplication("com.example.foo");
        var deps = new AndroidDependencies(app, "stable");
        var versions = [
            "1.2.3.4",
            "5.9.7.8",
            "7.6.5.4"
        ];
        var version = deps.pickLatest(versions);
        test.equal(version, "7.6.5.4");
        Util.deleteTmpApplication(app);
        test.done();
    },

    pickLatest2: function(test) {

        test.expect(1);

        var app = Util.createTmpApplication("com.example.foo");
        // Bad test, suppress error output
        app.config.setSilentConsole(true);

        var deps = new AndroidDependencies(app, "stable");
        var version = deps.pickLatest(null);
        test.equal(version, null);
        Util.deleteTmpApplication(app);
        test.done();
    },

    pickLatest3: function(test) {

        test.expect(1);

        var app = Util.createTmpApplication("com.example.foo");
        // Bad test, suppress error output
        app.config.setSilentConsole(true);

        var deps = new AndroidDependencies(app, "stable");
        var version = deps.pickLatest([]);
        test.equal(version, null);
        Util.deleteTmpApplication(app);
        test.done();
    },

    fetchVersions: function(test) {

        test.expect(2);

        var app = Util.createTmpApplication("com.example.foo");
        var deps = new AndroidDependencies(app, "stable");
        deps.fetchVersions(function(versions, errormsg) {

            if (errormsg)
                _output.info(errormsg);

            test.equal(versions instanceof Array, true);
            test.equal(versions.length > 0, true);
            Util.deleteTmpApplication(app);
            test.done();
        });
    },

    download: function(test) {

        test.expect(2);

        var app = Util.createTmpApplication("com.example.foo");
        var deps = new AndroidDependencies(app, "stable");
        var tmpDir = Util.createTmpDir();
        deps.download("9.38.208.10", tmpDir, function(filename, errormsg) {

            if (errormsg)
                _output.info(errormsg);

            test.equal(typeof filename === "string", true);
            test.equal(filename.length > 0, true);
            ShellJS.rm("-rf", tmpDir);
            Util.deleteTmpApplication(app);
            test.done();
        });
    }
};
