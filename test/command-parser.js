// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// Run tests silently to avoid spew from tests failing on purpose.
require("../src/Config").getInstance().setSilentConsole(true);
var CommandParser = require("../src/CommandParser");

var _output = require("../src/TerminalOutput").getInstance();


exports.tests = {

    ctor: function(test) {

        test.expect(2);

        // Invalid instantiation without argv, throws TypeError.
        try {
            var cp1 = new CommandParser(_output);
        } catch(e) {
            test.equal(e instanceof TypeError, true);
        }

        // Valid instantiation.
        var cp2 = new CommandParser(_output, ["foo", "bar", "baz"]);
        test.equal(cp2 instanceof CommandParser, true);

        test.done();
    },

    getCommand: function(test) {

        test.expect(8);

        var commands = ["create", "update", "refresh", "build", "help", "version"];
        var argv = ["foo", "bar"];
        var cp1;
        var cmd1;

        // Test peekCommand() gives back correct command.
        commands.forEach(function(item) {

            argv[2] = item;
            cp1 = new CommandParser(_output, argv);
            cmd1 = cp1.peekCommand();
            test.equal(cmd1, item);
        });

        // Test invalid command "baz" not recognised.
        var cp2 = new CommandParser(_output, ["foo", "bar", "baz"]);
        var cmd2 = cp2.getCommand();
        test.equal(commands.indexOf(cmd2), -1);

        // getCommand() must be false because of bogus command.
        test.equal(cp2.getCommand(), null);

        test.done();
    },

    createGetPackageId: function(test) {

        test.expect(13);

        // Good test
        var argv1 = ["node", "foo", "create", "com.example.bar"];
        var cp1 = new CommandParser(_output, argv1);

        test.equal(cp1.getCommand(), "create");

        var cmd1 = cp1.getCommand();
        test.equal(cmd1, argv1[2]);

        var pkg1 = cp1.createGetPackageId();
        test.equal(pkg1, argv1[3]);

        // Bad test, invalid package name
        var argv2 = ["node", "foo", "create", "com.exam ple.bar"];
        var cp2 = new CommandParser(_output, argv2);

        test.equal(cp2.getCommand(), null);

        var pkg2 = cp2.createGetPackageId();
        test.equal(pkg2, null);

        // Bad test, invalid package name
        argv2 = ["node", "foo", "create", "1com.example.bar"];
        cp2 = new CommandParser(_output, argv2);
        test.equal(cp2.getCommand(), null);
        pkg2 = cp2.createGetPackageId();
        test.equal(pkg2, null);

        // Bad test, invalid package name
        argv2 = ["node", "foo", "create", "com.1example.bar"];
        cp2 = new CommandParser(_output, argv2);
        test.equal(cp2.getCommand(), null);
        pkg2 = cp2.createGetPackageId();
        test.equal(pkg2, null);

        // Bad test, invalid package name
        argv2 = ["node", "foo", "create", "com.example.1bar"];
        cp2 = new CommandParser(_output, argv2);
        test.equal(cp2.getCommand(), null);
        pkg2 = cp2.createGetPackageId();
        test.equal(pkg2, null);

        // Bad test, invalid package name (uppercase)
        argv2 = ["node", "foo", "create", "com.example.Bar"];
        cp2 = new CommandParser(_output, argv2);
        test.equal(cp2.getCommand(), null);
        pkg2 = cp2.createGetPackageId();
        test.equal(pkg2, null);

        test.done();
    },

    updateGetVersion: function(test) {

        test.expect(8);

        // No version, good test
        var argv0 = ["node", "foo", "update"];
        var cp0 = new CommandParser(_output, argv0);

        test.equal(cp0.getCommand(), "update");

        var cmd0 = cp0.getCommand();
        test.equal(cmd0, argv0[2]);

        var version0 = cp0.updateGetVersion();
        test.equal(version0, null);

        // Good test
        var argv1 = ["node", "foo", "update", "12.34.56.78"];
        var cp1 = new CommandParser(_output, argv1);

        test.equal(cp1.getCommand(), "update");

        var cmd1 = cp1.getCommand();
        test.equal(cmd1, argv1[2]);

        var version1 = cp1.updateGetVersion();
        test.equal(version1, argv1[3]);

        // Bad test, invalid version
        var argv2 = ["node", "foo", "update", "12.34.x6.78"];
        var cp2 = new CommandParser(_output, argv2);

        test.equal(cp2.getCommand(), null);

        var version2 = cp2.updateGetVersion();
        test.equal(version2, false);

        test.done();
    },

    buildGetType: function(test) {

        test.expect(11);

        // Good test, default build "debug"
        var argv1 = ["node", "foo", "build"];
        var cp1 = new CommandParser(_output, argv1);

        test.equal(cp1.getCommand(), "build");

        var cmd1 = cp1.getCommand();
        test.equal(cmd1, argv1[2]);

        var type1 = cp1.buildGetType();
        test.equal(type1, "debug");

        // Good test, build "debug"
        var argv2 = ["node", "foo", "build", "debug"];
        var cp2 = new CommandParser(_output, argv2);

        test.equal(cp2.getCommand(), "build");

        var cmd2 = cp2.getCommand();
        test.equal(cmd2, argv2[2]);

        var type2 = cp2.buildGetType();
        test.equal(type2, argv2[3]);

        // Good test, build "release"
        var argv3 = ["node", "foo", "build", "release"];
        var cp3 = new CommandParser(_output, argv3);

        test.equal(cp3.getCommand(), "build");

        var cmd3 = cp3.getCommand();
        test.equal(cmd3, argv3[2]);

        var type3 = cp3.buildGetType();
        test.equal(type3, "release");

        // Bad test, unknown type
        var argv4 = ["node", "foo", "build", "foo"];
        var cp4 = new CommandParser(_output, argv4);

        test.equal(cp4.getCommand(), null);

        var type4 = cp4.buildGetType();
        test.equal(type4, null);

        test.done();
    }
};
