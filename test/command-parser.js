// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var CommandParser = require("../src/CommandParser");

exports.tests = {

    ctor: function(test) {

        test.expect(2);

        // Invalid instantiation without argv, throws TypeError.
        try {
            var cp1 = new CommandParser();
        } catch(e) {
            test.equal(e instanceof TypeError, true);
        }

        // Valid instantiation.
        var cp2 = new CommandParser(["foo", "bar", "baz"]);
        test.equal(cp2 instanceof CommandParser, true);

        test.done();
    },

    getCommand: function(test) {

        test.expect(5);

        var commands = ["create", "update", "refresh", "build"];
        var argv = ["foo", "bar"];
        var cp1;

        // Test getCommand() gives back correct command.
        commands.forEach(function(item) {

            argv[2] = item;
            cp1 = new CommandParser(argv);
            test.equal(cp1.getCommand(), item);
        });

        // Test invalid command "baz" not recognised.
        var cp2 = new CommandParser(["foo", "bar", "baz"]);
        var cmd = cp2.getCommand();
        test.equal(commands.indexOf(cmd), -1);

        test.done();
    },

    createGetPackage: function(test) {

        test.expect(4);

        // Good test
        var argv1 = ["node", "foo", "create", "com.example.Bar"];
        var cp1 = new CommandParser(argv1);

        var cmd1 = cp1.getCommand();
        test.equal(cmd1, argv1[2]);

        var pkg1 = cp1.createGetPackage();
        test.equal(pkg1, argv1[3]);

        // Bad test, invalid package name
        var argv2 = ["node", "foo", "create", "com.exam ple.Bar"];
        var cp2 = new CommandParser(argv2);

        var cmd2 = cp2.getCommand();
        test.equal(cmd2, argv2[2]);

        var pkg2 = cp2.createGetPackage();
        test.equal(pkg2, null);

        test.done();
    },

    updateGetVersion: function(test) {

        test.expect(4);

        // Good test
        var argv1 = ["node", "foo", "update", "12.34.56.78"];
        var cp1 = new CommandParser(argv1);

        var cmd1 = cp1.getCommand();
        test.equal(cmd1, argv1[2]);

        var version1 = cp1.updateGetVersion();
        test.equal(version1, argv1[3]);

        // Bad test, invalid version
        var argv2 = ["node", "foo", "update", "12.34.x6.78"];
        var cp2 = new CommandParser(argv2);

        var cmd2 = cp2.getCommand();
        test.equal(cmd2, argv2[2]);

        var version2 = cp2.updateGetVersion();
        test.equal(version2, null);

        test.done();
    },

    buildGetType: function(test) {

        test.expect(8);

        // Good test, default build "debug"
        var argv1 = ["node", "foo", "build"];
        var cp1 = new CommandParser(argv1);

        var cmd1 = cp1.getCommand();
        test.equal(cmd1, argv1[2]);

        var type1 = cp1.buildGetType();
        test.equal(type1, "debug");

        // Good test, build "debug"
        var argv2 = ["node", "foo", "build", "debug"];
        var cp2 = new CommandParser(argv2);

        var cmd2 = cp2.getCommand();
        test.equal(cmd2, argv2[2]);

        var type2 = cp2.buildGetType();
        test.equal(type2, argv2[3]);

        // Good test, build "release"
        var argv3 = ["node", "foo", "build", "release"];
        var cp3 = new CommandParser(argv3);

        var cmd3 = cp3.getCommand();
        test.equal(cmd3, argv3[2]);

        var type3 = cp3.buildGetType();
        test.equal(type3, "release");

        // Bad test, unknown type
        var argv4 = ["node", "foo", "build", "foo"];
        var cp4 = new CommandParser(argv4);

        var cmd4 = cp4.getCommand();
        test.equal(cmd4, argv4[2]);

        var type4 = cp4.buildGetType();
        test.equal(type4, null);

        test.done();
    }
};
