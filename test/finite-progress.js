// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(false);
var Console = require("../src/Console");

exports.tests = {

    progress: function(test) {

        test.expect(10);

        var progress = 0;
        var indicator = Console.createFiniteProgress("foo");
        var interval = setInterval(callback, 200);

        function callback() {

            indicator.update(progress);
            progress += 0.1;

            if (progress > 1) {
                clearInterval(interval);
                indicator.done("done");
                test.done();
                return;
            }

            test.equal(true, true);
        }
    }
};
