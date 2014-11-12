// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(true);
var Console = require("../src/Console");
var AndroidSDK = require("../src/AndroidSDK");
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

exports.tests = {

    ctor: function(test) {

        test.expect(1);

        // Throws exception if not available.
        try {
            var sdk = new AndroidSDK();
            test.equal(true, true);
        } catch (e) {
            // Fall through
            // Test will fail because number of assertions not correct.
        }

        test.done();
    },

    queryTarget: function(test) {

        test.expect(1);

        var sdk = new AndroidSDK();
        sdk.queryTarget(14, function(target, error) {

            Console.log("  " + target);
            // Oh well this is quite hacky but we have no way of
            // knowing what targets actually are anywhere. So just
            // Demand one to be there, greater API level 14 as per
            // above, means Android 4.0+.
            test.equal(typeof target, "string");

            test.done();
        });
    },

    generateProjectTemplate: function(test) {

        test.expect(2);

        var sdk = new AndroidSDK();
        sdk.queryTarget(14, function(target, error) {

            Console.log("  " + target);
            test.equal(typeof target, "string");

            var path = null;
            var log = null;
            var errormsg = null;

            // MkTemp creates temp dir in working dir, so cd tmp first.
            ShellJS.pushd(OS.tmpdir());

            var tmpdir = MkTemp.createDirSync("XXXXXX.crosswalk-app-tools");
            Console.log("Tempdir: " + tmpdir);
            ShellJS.pushd(tmpdir);

            sdk.generateProjectTemplate("com.example.Foo", target,
                                        function(path, log, errormsg) {

                if (errormsg) {
                    Console.error(errormsg);
                } else {
                    Console.log(log);
                    test.equal(true, true);
                    test.done();
                }

                // Clean up removing project skeleton directory.
                ShellJS.popd();
                ShellJS.popd();
                ShellJS.rm('-rf', tmpdir);
            });
        });
    }
};
