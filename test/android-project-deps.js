// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');

var AndroidProjectDeps = require("../src/android/AndroidProjectDeps");

// Test involves progress output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _application = require("../src/Main");
var _output = _application.output;

exports.tests = {

    pickLatest1: function(test) {

        test.expect(1);

        var deps = new AndroidProjectDeps(_application, "stable");
        var versions = [
            "1.2.3.4",
            "5.9.7.8",
            "7.6.5.4"
        ];
        var version = deps.pickLatest(versions);
        test.equal(version, "7.6.5.4");
        test.done();
    },

    pickLatest2: function(test) {

        test.expect(1);

        // Bad test, suppress error output
        _application.config.setSilentConsole(true);

        var deps = new AndroidProjectDeps(_application, "stable");
        var version = deps.pickLatest(null);
        test.equal(version, null);
        test.done();

        _application.config.setSilentConsole(false);
    },

    pickLatest3: function(test) {

        test.expect(1);

        // Bad test, suppress error output
        _application.config.setSilentConsole(true);

        var deps = new AndroidProjectDeps(_application, "stable");
        var version = deps.pickLatest([]);
        test.equal(version, null);
        test.done();

        _application.config.setSilentConsole(false);
    },

    fetchVersions: function(test) {

        test.expect(2);

        var deps = new AndroidProjectDeps(_application, "stable");
        deps.fetchVersions(function(versions, errormsg) {

            if (errormsg)
                _output.info(errormsg);

            test.equal(versions instanceof Array, true);
            test.equal(versions.length > 0, true);
            test.done();
        });
    },

    download: function(test) {

        test.expect(2);

        var deps = new AndroidProjectDeps(_application, "stable");
        deps.download("9.38.208.10", OS.tmpDir(), function(filename, errormsg) {

            if (errormsg)
                _output.info(errormsg);

            test.equal(typeof filename === "string", true);
            test.equal(filename.length > 0, true);
            test.done();
        });
    }
};
