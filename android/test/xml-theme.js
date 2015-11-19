// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

var XmlTheme = require("../lib/XmlTheme.js");
var Util = require("../../test-util/Util.js");

var _output = require("../../src/TerminalOutput").getInstance();



function createTheme() {

    var path = Util.createTmpFile();
    var content = '' +
'<?xml version="1.0" encoding="utf-8"?>\n' +
'\n' +
'<!--\n' +
'Copyright (c) 2014 Intel Corporation. All rights reserved.\n' +
'Use of this source code is governed by a BSD-style license that can be\n' +
'found in the LICENSE file.\n' +
'-->\n' +
'\n' +
'<resources>\n' +
'    <!-- Application theme. -->\n' +
'    <color name="white">#FFFFFFFF</color>\n' +
'    <style name="AppTheme" parent="@android:style/Theme.Holo.Light.NoActionBar">\n' +
'        <item name="android:windowFullscreen">false</item>\n' +
'        <item name="android:windowBackground">@color/white</item>\n' +
'    </style>\n' +
'</resources>\n';

    FS.writeFileSync(path, content);

    return path;
}

exports.tests = {

    background: function(test) {

        test.expect(2);

        var path = createTheme();
        var theme = new XmlTheme(_output, path);
        test.equal(theme.background, "@color/white");

        // change and read back
        theme.background = "@null";
        theme = new XmlTheme(_output, path);
        test.equal(theme.background, "@null");

        ShellJS.rm("-f", path);

        test.done();
    },

    fullscreen: function(test) {

        test.expect(2);

        var path = createTheme();
        var theme = new XmlTheme(_output, path);
        test.equal(theme.fullscreen, false);

        // change and read back
        theme.fullscreen = true;
        theme = new XmlTheme(_output, path);
        test.equal(theme.fullscreen, true);

        ShellJS.rm("-f", path);

        test.done();
    }
};
