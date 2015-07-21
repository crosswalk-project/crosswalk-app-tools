// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

var JavaActivity = require("../lib/JavaActivity.js");
var Util = require("../../test-util/Util.js");

var _output = require("../../src/TerminalOutput").getInstance();

// Copyright (c) 2013 Intel Corporation. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

exports.tests = {

    roundtrip: function(test) {

var buffer = "" +
"package org.xwalk.app.template;\n" +
"\n" +
"import org.xwalk.app.XWalkRuntimeActivityBase;\n" +
"\n" +
"public class AppTemplateActivity extends XWalkRuntimeActivityBase {\n" +
"\n" +
"    @Override\n" +
"    public void onCreate(Bundle savedInstanceState) {\n" +
"        super.onCreate(savedInstanceState);\n" +
"    }\n" +
"\n" +
"    private boolean isNewerThanKitkat() {\n" +
"        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT;\n" +
"    }\n" +
"}\n";

        test.expect(2);

        var path = Util.createTmpFile();
        FS.writeFileSync(path, buffer);

        var activity = new JavaActivity(_output, path);
        activity.enableRemoteDebugging(true);

        var inBuf = FS.readFileSync(path, {"encoding": "utf8"});
        test.equal(inBuf.indexOf("setRemoteDebugging(true);") > -1, true);

        activity.enableRemoteDebugging(false);
        inBuf = FS.readFileSync(path, {"encoding": "utf8"});
        test.equal(inBuf.indexOf("setRemoteDebugging(true);"),-1);

        ShellJS.rm("-f", path);

        test.done();
    }

};
