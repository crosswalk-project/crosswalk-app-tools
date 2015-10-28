// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require('os');
var ShellJS = require("shelljs");

var TemplateFile = require("../src/util/TemplateFile");
var Util = require("../test-util/Util.js");

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").getInstance().setSilentConsole(true);
var _output = require("../src/TerminalOutput").getInstance();


exports.tests = {

    ctor: function(test) {

        test.expect(1);

        try {
            var tpl = new TemplateFile(__dirname + "/data/template-file.in");
            test.equal(true, true);
        } catch(e) {
            _output.error(e.message);
            test.equal(true, false);
        }

        test.done();
    },

    render: function(test) {

        test.expect(1);

        try {
            var tpl = new TemplateFile(__dirname + "/data/template-file.in");

            var tmpfile = Util.createTmpFile();
            _output.info("Tempfile:", tmpfile);

            tpl.render({bar: "maman"}, tmpfile);

            // Read back in and compare.
            var output = FS.readFileSync(tmpfile, {"encoding": "utf8"});
            test.equal(output, "foo maman baz");

            ShellJS.rm("-f", tmpfile);

        } catch(e) {
            _output.error(e.message);
            test.equal(true, false);
        }

        test.done();
    }
};
