// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

function TestPlatformScope(PlatformBase, baseData) {

    function TestPlatform(PlatformBase, baseData) {
        // Chain up constructor.
        PlatformBase.call(this, baseData);
    }
    TestPlatform.prototype = PlatformBase.prototype;

    TestPlatform.prototype.generate =
    function(options, callback) {
        // Null means success, error string means failure.
        callback(null);
    };

    TestPlatform.prototype.update =
    function(callback) {
        // Null means success, error string means failure.
        callback(null);
    };

    TestPlatform.prototype.refresh =
    function(callback) {
        // Null means success, error string means failure.
        callback(null);
    };

    TestPlatform.prototype.build =
    function(abis, release, callback) {
        // Null means success, error string means failure.
        callback(null);
    };

    return new TestPlatform(PlatformBase, baseData);
}

module.exports = TestPlatformScope;
