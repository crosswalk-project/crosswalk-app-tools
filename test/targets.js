// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Targets = require("../src/util/Targets");

exports.tests = {

    nil: function(test) {

        test.expect(1);

        var match = Targets.match(null);
        test.equal(match.length === 0, true);

        test.done();
    },

    empty: function(test) {

        test.expect(1);

        var match = Targets.match(null);
        test.equal(match.length === 0, true);

        test.done();
    },

    exact: function(test) {

        var abis = ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"];
        test.expect(abis.length);

        abis.forEach(function (abi) {
            var match = Targets.match(abi);
            test.equal(match.length == 1 && match[0] === abi, true);
        });

        test.done();
    },

    prefixA: function(test) {

        var abis = ["a", "ar", "arm"];
        test.expect(abis.length);

        abis.forEach(function (abi) {
            var match = Targets.match(abi);
            test.equal(match.length == 2 &&
                       match[0] == "armeabi-v7a" &&
                       match[1] == "arm64-v8a", true);
        });

        test.done();
    },

    prefixArme: function(test) {

        test.expect(1);

        var match = Targets.match("arme");
        test.equal(match.length == 1 && match[0] == "armeabi-v7a", true);

        test.done();
    },

    prefixX: function(test) {

        var abis = ["x", "x8"];
        test.expect(abis.length);

        abis.forEach(function (abi) {
            var match = Targets.match(abi);
            test.equal(match.length == 2 &&
                       match[0] == "x86" &&
                       match[1] == "x86_64", true);
        });

        test.done();
    },

    size32: function(test) {

        // Test both number and string matching.
        var keys = [32, "32"];
        test.expect(keys.length);

        keys.forEach(function (key) {
            var match = Targets.match(key);
            test.equal(match.length == 2 &&
                       match[0] == "armeabi-v7a" &&
                       match[1] == "x86", true);
        });

        test.done();
    },

    size64: function(test) {

        // Test both number and string matching.
        var keys = [64, "64"];
        test.expect(keys.length);

        keys.forEach(function (key) {
            var match = Targets.match(key);
            test.equal(match.length == 2 &&
                       match[0] == "arm64-v8a" &&
                       match[1] == "x86_64", true);
        });

        test.done();
    }
};
