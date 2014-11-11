// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Interface for project implementations.
 */
var Project = {

    /**
     * Generate project template.
     * @function generate
     * @param {String} packageId Package name in com.example.Foo format.
     * @returns {String} null on Success, error message on failure.
     * @abstract
     */
    generate: function(packageId) {

        throw new Error("Project.generate() not implemented.");
    },

    update: function() {

        throw new Error("Project.update() not implemented.");
    },

    refresh: function() {

        throw new Error("Project.refresh() not implemented.");
    },

    build: function() {

        throw new Error("Project.build() not implemented.");
    }
};

module.exports = Project;
