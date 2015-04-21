// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").getInstance().setSilentConsole(false);
var AndroidPlatform = require("../android/src/AndroidPlatform");
var PlatformBase = require("../src/PlatformBase");
var Util = require("./util/Util.js");

exports.tests = {

    stableLatest: function(test) {

        test.expect(1);

        var application = Util.createTmpApplication("com.example.foo");
        var platformData = {
            application: application,
            platformId: "android"
        };

        var android = new AndroidPlatform(PlatformBase, platformData);
        android.findCrosswalkVersion(null, "stable",
                                     function(version, channel, errormsg) {

            test.equal(typeof version, "string");

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    beta: function(test) {

        test.expect(2);

        var application = Util.createTmpApplication("com.example.foo");
        var platformData = {
            application: application,
            platformId: "android"
        };

        var android = new AndroidPlatform(PlatformBase, platformData);
        var versionSought = "12.41.296.4";
        var channelSought = "beta";
        android.findCrosswalkVersion(versionSought, null,
                                     function(version, channel, errormsg) {

            test.equal(version, versionSought);
            test.equal(channel, channelSought);

            Util.deleteTmpApplication(application);
            test.done();
        });
    },

    invalid: function(test) {

        test.expect(2);

        var application = Util.createTmpApplication("com.example.foo");
        var platformData = {
            application: application,
            platformId: "android"
        };

        var android = new AndroidPlatform(PlatformBase, platformData);
        android.findCrosswalkVersion("0.0.0.0", null,
                                     function(version, channel, errormsg) {

            test.equal(version, null);
            test.equal(channel, null);

            Util.deleteTmpApplication(application);
            test.done();
        });
    }
};
