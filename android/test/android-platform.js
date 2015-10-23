// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var AndroidPlatform = require("../lib/AndroidPlatform");
var PlatformBase = require("../../src/PlatformBase");
var Util = require("../../test-util/Util.js");

exports.tests = {

    generateVersionCode: function(test) {

        var versions = [
            "1",
            "1.1",
            "1.1.1",
            "11.1.1",
            "11.11.1",
            "11.11.11",
            "11.11.111"
        ];

        var codes = [
            "60000001",
            "60001001",
            "60101001",
            "61101001",
            "61111001",
            "61111011",
            "61111111"
        ];

        test.expect(versions.length);

        var application = Util.createTmpApplication("com.example.foo");
        var platformData = {
            application: application,
            platformId: "android"
        };

        var android = new AndroidPlatform(PlatformBase, platformData);

        for (var i = 0; i < versions.length; i++) {

            var versionCode = android.generateVersionCode(application.output,
                                                          versions[i],
                                                          "x86");
            test.equal(versionCode, codes[i]);
        }

        Util.deleteTmpApplication(application);
        test.done();
    }
};
