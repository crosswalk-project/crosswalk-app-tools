// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

function TestPlatformScope(PlatformBase, baseData) {

    function TestPlatform(PlatformBase, baseData) {
        // Chain up constructor.
        PlatformBase.call(this, baseData);
    }
    TestPlatform.prototype = Object.create(PlatformBase.prototype);
    TestPlatform.prototype.constructor = TestPlatform;

    TestPlatform.prototype.create =
    function(packageId, args, callback) {
        // Null means success, error string means failure.
        callback(null);
    };

    TestPlatform.prototype.build =
    function(configId, args, callback) {
        // Null means success, error string means failure.
        callback(null);
    };

    return new TestPlatform(PlatformBase, baseData);
}

TestPlatformScope.getArgs = function() {
    return {
        create: { // Extra options for command "create"
            foo: "Create option added by the platform",
            bar: "Another create option added by the platform"
        }
    };
};

TestPlatformScope.getEnv = function() {
    return {
        CROSSWALK_APP_TOOL_TEST_FOO: "Another create option added by the platform"
    };
};

module.exports = TestPlatformScope;
