// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(true);
var AndroidSDK = require("../src/AndroidSDK");

exports.tests = {

    isAvailable: function(test) {

        test.expect(1);

        var sdk = new AndroidSDK();
        var available = sdk.isAvailable();
        test.equal(available, true);

        test.done();
    }
};
