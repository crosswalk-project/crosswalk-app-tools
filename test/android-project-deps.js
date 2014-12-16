// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(true);
var Console = require("../src/Console");
var AndroidProjectDeps = require("../src/AndroidProjectDeps");

exports.tests = {

    load: function(test) {

        test.expect(2);

        var deps = new AndroidProjectDeps("stable");
        deps.load(function(versions, errormsg) {

            if (versions)
                Console.log(versions);

            if (errormsg)
                Console.log(errormsg);

            test.equal(versions instanceof Array, true);
            test.equal(versions.length > 0, true);
            test.done();
        });

    }
};
