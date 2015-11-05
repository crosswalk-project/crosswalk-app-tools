// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');

var ShellJS = require("shelljs");

var Download01Org = require("../src/util/Download01Org");
var Util = require("../test-util/Util.js");

var _output = require("../src/TerminalOutput").getInstance();


exports.tests = {

    fetchVersions: function(test) {

        test.expect(2);

        var app = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(app, "android", "stable");
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
        var deps = new Download01Org(app, "android", "stable");
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
    },

    stableLatest: function(test) {

        test.expect(1);

        var application = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(application, "android", "stable");
        deps.findCrosswalkVersion(null, "stable",
                                     function(version, channel, errormsg) {

            test.equal(typeof version, "string");

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    beta: function(test) {

        test.expect(2);

        var application = Util.createTmpApplication("com.example.foo");
        var versionSought = "12.41.296.4";
        var channelSought = "beta";
        var deps = new Download01Org(application, "android", channelSought);
        deps.findCrosswalkVersion(versionSought, null,
                                     function(version, channel, errormsg) {

            test.equal(version, versionSought);
            test.equal(channel, channelSought);

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    canaryLatest: function(test) {

        test.expect(1);

        var application = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(application, "android", "canary");
        deps.findCrosswalkVersion(null, "canary",
                                  function(version, channel, errormsg) {

            test.equal(typeof version, "string");

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    canary64latest: function(test) {

        test.expect(1);

        var application = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(application, "android", "canary");
        deps.androidWordSize = 64;
        deps.findCrosswalkVersion(null, "canary",
                                  function(version, channel, errormsg) {

            test.equal(typeof version, "string");

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    lite: function(test) {

        test.expect(1);

        var application = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(application, "android", "stable");
        deps.androidFlavor = "crosswalk-lite";
        deps.findCrosswalkVersion(null, null,
                                  function(version, channel, errormsg) {

            test.equal(typeof version, "string");

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    invalid: function(test) {

        test.expect(2);

        var application = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(application, "android", "stable");
        deps.findCrosswalkVersion("0.0.0.0", null,
                                     function(version, channel, errormsg) {

            test.equal(version, null);
            test.equal(channel, null);

            Util.deleteTmpApplication(application);
            test.done();
        });
    }
};
