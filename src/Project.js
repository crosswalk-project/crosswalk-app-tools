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
function projectCb(result) {}

/**
 * Interface for project implementations.
 */
var Project = {

    /**
     * Generate project template.
     * @function generate
     * @param {String} packageId Package name in com.example.Foo format.
     * @param {Function} callback see {@link Project~projectCb}.
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

    /**
     * Build application package.
     * @function build
     * @param {String[]} abi Array of ABIs, supported armeabi-v7a, x86.
     * @param {Boolean} release Whether to build debug or release package.
     * @param {Function} callback see {@link Project~projectCb}.
     * @abstract
     */
    build: function(abis, release, callback) {

        throw new Error("Project.build() not implemented.");
    }
};

module.exports = Project;
