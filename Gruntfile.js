var remapify = require('remapify');
module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');
    grunt.initConfig({
        pkg: pkg,
        browserify: {
            options: {
                debug: true
            },
            dist: {
                src: ['src/appforms.js'],
                dest: 'dist/appforms.js',
                options: {
                    debug: false,
                    banner: "//Drag & Drop Apps Javascript SDK"
                },
                transform: ["browserify-shim"]
            },
            specs: {
                src: ['test/specs/**/*-Specs.js'],
                dest: 'test/public/build/specs.js'
            }
        },
        jshint: {
            test: {
                options: {
                    debug: true
                },
                src: ['Gruntfile.js', 'src/**/*.js', '!src/rulesEngine.js', 'test/specs/**/*.js']
            },
            dist: {
                options: {
                    debug: false
                },
                src: ['Gruntfile.js', 'src/**/*.js', '!src/rulesEngine.js', 'test/specs/**/*.js']
            }
        },
        clean: ["dist/appforms.js", "test/public/build/specs.js"],
        jasmine: {
            all: {
                options: {
                    specs: 'test/public/build/specs.js'
                }
            }
        },
        karma: {
            unit: {
                options: {
                    files: ['test/public/build/specs.js'],
                    frameworks: ['jasmine'],
                    browsers: ['Chrome'],
                    watch: true,
                    singleRun: false,
                    debug: true
                }
            }
        }
    });

    //Nice packages.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('buildTest', ['clean', 'jshint:test', 'browserify']);

    grunt.registerTask('testServer', ['karma:unit']);

};