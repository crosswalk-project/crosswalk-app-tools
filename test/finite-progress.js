// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Test involves progress output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _output = require("../src/TerminalOutput").getInstance();


exports.tests = {

    progress: function(test) {

        test.expect(10);

        var progress = 0;
        var indicator = _output.createFiniteProgress("foo");
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
    },

    interruptedProgress: function(test) {

        test.expect(10);

        var progress = 0;
        var indicator = _output.createFiniteProgress("foo");
        var interval = setInterval(callback, 200);

        function callback() {

            indicator.update(progress);
            progress += 0.1;

            if (progress > 0.19 && progress < 0.21)
                _output.info("info " + progress);
            else if (progress > 0.39 && progress < 0.41)
                _output.warning("warning " + progress);
            else if (progress > 0.59 && progress < 0.61)
                _output.error("error " + progress);
            else if (progress > 0.79 && progress < 0.81)
                _output.highlight("highlight " + progress);

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
