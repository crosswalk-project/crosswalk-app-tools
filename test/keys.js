// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require('path');

var ShellJS = require("shelljs");

var Keys = require("../src/util/Keys");

var Util = require("../test-util/Util.js");

exports.tests = {

    getGoogleApiKeys: function(test) {

        test.expect(3);

        var buf = '{' +
        '"test": {' +
        '        "google": {' +
        '            "GOOGLE_API_KEY": "foo",' +
        '            "GOOGLE_DEFAULT_CLIENT_ID": "bar",' +
        '            "GOOGLE_DEFAULT_CLIENT_SECRET": "baz"' +
        '        }' +
        '    }' +
        '}';

        var basePath = Util.createTmpDir();
        var path = Path.join(basePath, "test");
        FS.writeFileSync(path, buf);

        var googleKeys = Keys.getGoogleApiKeys(path);
        test.equal(googleKeys.GOOGLE_API_KEY === "foo", true);
        test.equal(googleKeys.GOOGLE_DEFAULT_CLIENT_ID === "bar", true);
        test.equal(googleKeys.GOOGLE_DEFAULT_CLIENT_SECRET === "baz", true);

        ShellJS.rm("-rf", basePath);

        test.done();
    }
};
