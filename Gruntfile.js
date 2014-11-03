module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    nodeunit: {
      all: ['test/**/*.js'],
      options: {
        reporter: 'junit',
        //reporter: 'verbose',
        reporterOptions: {
          output: 'test-results'
        }
      }
    },

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        /* options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        } */
      }
    },

    jsdoc : {
        dist : {
            src: ['src/**/*.js'],
            options: {
                destination: 'doc'
            }
        }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['jshint', 'nodeunit']);
  grunt.registerTask('doc', ['jshint', 'nodeunit', 'jsdoc']);
  grunt.registerTask('test', ['jshint', 'nodeunit']);
};
