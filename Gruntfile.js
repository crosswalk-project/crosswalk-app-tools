module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    qunit: {
      files: ['test/**/*.html']
    },

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    },

    jsdoc : {
        dist : {
            src: ['src/*.js'],
            options: {
                destination: 'doc'
            }
        }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('docs', ['jsdoc']);

  // grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('test', ['jshint']);

  // grunt.registerTask('default', ['jshint', 'qunit']);
  grunt.registerTask('default', ['jshint']);

};
