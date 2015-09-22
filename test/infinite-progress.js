// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Test involves progress output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _output = require("../src/TerminalOutput").getInstance();


exports.tests = {

    progress: function(test) {

        test.expect(4);

        var tags = ["foo", "bar", "baz", "maman"];
        var index = 0;
        var indicator = _output.createInfiniteProgress("foo");
        var interval = setInterval(callback, 300);

        function callback() {

            indicator.update(tags[index]);
            index++;
            test.equal(true, true);

            if (index >= tags.length) {
                indicator.done("done");
                clearInterval(interval);
                test.done();
                return;
            }
        }
    },

    interruptedProgress: function(test) {

        test.expect(5);

        var tags = ["foo", "bar", "baz", "maman", "quux"];
        var index = 0;
        var indicator = _output.createInfiniteProgress("foo");
        var interval = setInterval(callback, 300);

        function callback() {

            indicator.update(tags[index]);

            switch (index) {
            case 0:
            _output.info("info " + index);
                break;
            case 1:
                _output.warning("warning " + index);
                break;
            case 2:
                _output.error("error " + index);
                break;
            case 3:
                _output.highlight("highlight " + index);
                break;
            }

            index++;
            test.equal(true, true);

            if (index >= tags.length) {
                indicator.done("done");
                clearInterval(interval);
                test.done();
                return;
            }
        }
    }
};
