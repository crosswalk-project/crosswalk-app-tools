// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

function Project() {}

Project.prototype.generate = function() {

    throw new Error("Project.generate() not implemented.");
};

Project.prototype.update = function() {

    throw new Error("Project.update() not implemented.");
};

Project.prototype.refresh = function() {

    throw new Error("Project.refresh() not implemented.");
};

Project.prototype.build = function() {

    throw new Error("Project.build() not implemented.");
};

module.exports = Project;
