// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").setSilentConsole(true);
var Console = require("../src/Console");
var TemplateFile = require("../src/TemplateFile");


exports.tests = {

    ctor: function(test) {

        test.expect(1);

        //
        var tpl;
        try {
            tpl = new TemplateFile(__dirname + "/data/template-file.in");
            test.equal(true, true);
        } catch(e) {
            Console.error(e.message);
            test.equal(true, false);
        }

        test.done();
    }
};
