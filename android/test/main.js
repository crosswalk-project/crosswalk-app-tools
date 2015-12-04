// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var ShellJS = require("shelljs");

var Application = require("../../src/Application");
var Util = require("../../test-util/Util.js");

var _packageId = "com.example.foo";

exports.tests = {

    create: function(test) {

        test.expect(1);

        // Good test.
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../../src/Main");
        Application.call(app, tmpdir, _packageId);
        app.create(_packageId, { 'android-crosswalk': 'canary' }, function(errno) {

            test.equal(errno, 0);

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

        var app = require("../../src/Main");
        Application.call(app, tmpdir, _packageId);
        app.create(_packageId, { 'android-crosswalk': 'canary' }, function(errno) {

            if (!errno) {

                // Build
                ShellJS.pushd(_packageId);
                app.build("debug", {}, function(errno) {

                    test.equal(errno, 0);
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
};
