// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Callback signature for {@link Project.generate}
 * @function generateCb
 * @param {String} errormsg null on success, otherwise error message.
 * @memberOf Project
 * @inner
 */
function generateCb(result) {}

/**
 * Interface for project implementations.
 */
var Project = {

    /**
     * Generate project template.
     * @function generate
     * @param {String} packageId Package name in com.example.Foo format.
     * @param {Function} callback see {@link Project~generateCb}
     * @returns {String} null on Success, error message on failure.
     * @abstract
     */
    generate: function(packageId, callback) {

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
