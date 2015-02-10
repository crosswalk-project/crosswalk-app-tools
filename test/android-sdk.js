// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");
var AndroidSDK = require("../src/android/AndroidSDK");

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").getInstance().setSilentConsole(true);
var _application = require("../src/Main");
var _output = _application.getOutput();

exports.tests = {

    ctor: function(test) {

        test.expect(1);

        // Throws exception if not available.
        try {
            var sdk = new AndroidSDK(_application);
            test.equal(true, true);
        } catch (e) {
            // Fall through
            // Test will fail because number of assertions not correct.
        }

        test.done();
    },

    queryTarget: function(test) {

        test.expect(1);

        var sdk = new AndroidSDK(_application);
        sdk.queryTarget(14, function(target, error) {

            _output.info("  " + target);
            // Oh well this is quite hacky but we have no way of
            // knowing what targets actually are anywhere. So just
            // Demand one to be there, greater API level 14 as per
            // above, means Android 4.0+.
            test.equal(typeof target, "string");

            test.done();
        });
    },

    generateProjectSkeleton: function(test) {

        test.expect(2);

        var sdk = new AndroidSDK(_application);
        sdk.queryTarget(14, function(target, error) {

            _output.info("  " + target);
            test.equal(typeof target, "string");

            var path = null;
            var log = null;
            var errormsg = null;

            // MkTemp creates temp dir in working dir, so cd tmp first.
            ShellJS.pushd(OS.tmpdir());

            var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
            _output.info("Tempdir: " + tmpdir);
            ShellJS.pushd(tmpdir);

            sdk.generateProjectSkeleton("com.example.Foo", target,
                                        function(path, log, errormsg) {

                if (errormsg) {
                    _output.error(errormsg);
                } else {
                    _output.info(log);
                    test.equal(true, true);
                    test.done();
                }

                // Clean up removing project skeleton directory.
                ShellJS.popd();
                ShellJS.popd();
                ShellJS.rm("-rf", tmpdir);
            });
        });
    }
};
