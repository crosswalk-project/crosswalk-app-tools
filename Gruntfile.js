module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    nodeunit: {
      common: 'test/*.js',
      android: 'android/test/*.js',
      windows: process.platform == 'win32' ? 'windows/test/*.js' : 'undefined',
      options: {
        reporter: 'default',
        reporterOptions: {
          output: 'test-results'
        }
      }
    },

    jshint: {
      files: ['Gruntfile.js',
              'src/**/*.js', 'test/*.js', 'test-util/*.js',
              'examples/**/*.js',
              'android/**/*.js',
              'windows/**/*.js'],
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
            src: ['src/**/*.js', 'android/lib/*.js'],
            options: {
                destination: 'doc'
            }
        }
    },

    release: {
      options: {
        add: true,
        commit: false,
        push: false,
        bump: false,
        tag: true,
        pushTags: false,
        npm: true,
        tagName: '<%= version %>',
        tagMessage: 'Version <%= version %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('default', ['jshint', 'nodeunit']);
  grunt.registerTask('doc', ['jshint', 'nodeunit', 'jsdoc']);
  grunt.registerTask('test', ['jshint', 'nodeunit']);
};
