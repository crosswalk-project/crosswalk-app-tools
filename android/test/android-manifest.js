// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

var AndroidManifest = require("../lib/AndroidManifest.js");
var Util = require("../../test-util/Util.js");

var _output = require("../../src/TerminalOutput").getInstance();



function createManifest() {

    var path = Util.createTmpFile();
    var content = '' +
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n' +
              'package="com.example.foo"\n' +
              'android:versionCode="1"\n' +
              'android:versionName="1.0"\n' +
              'android:installLocation="auto">\n' +
            '<application android:name="org.xwalk.core.XWalkApplication"\n' +
                'android:hardwareAccelerated="true"\n' +
                'android:label="foo"\n' +
                'android:icon="@drawable/crosswalk">\n' +
                '<activity android:name=".MainActivity"\n' +
                          'android:theme="@style/AppTheme"\n' +
                          'android:configChanges="orientation|keyboardHidden|keyboard|screenSize"\n' +
                          'android:screenOrientation="unspecified"\n' +
                          'android:label="foo">\n' +
                    '<intent-filter>\n' +
                        '<action android:name="android.intent.action.MAIN" />\n' +
                        '<category android:name="android.intent.category.LAUNCHER" />\n' +
                    '</intent-filter>\n' +
                '</activity>\n' +
            '</application>\n' +
            '<uses-sdk android:minSdkVersion="14" />\n' +
            '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n' +
            '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />\n' +
            '<uses-permission android:name="android.permission.INTERNET" />\n' +
        '</manifest>';

    FS.writeFileSync(path, content);

    return path;
}

exports.tests = {

    versionCode: function(test) {

        test.expect(1);

        var path = createManifest();
        var manifest = new AndroidManifest(_output, path);
        manifest.versionCode = "2";

        var manifest = new AndroidManifest(_output, path);
        test.equal(manifest.versionCode, "2");

        ShellJS.rm("-f", path);

        test.done();
    }
};
