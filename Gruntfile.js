/*global module:true, require:true */

module.exports = function(grunt) {
    'use strict';

    var pkg = grunt.file.readJSON('package.json');
    var beautify_html = require('js-beautify').html;
    var hljs = require('highlight.js');


    var swig_beautify = function(input) {
        return beautify_html(input.trim(), {
            indent_size: 2,
            indent_char: ' ',
            preserve_newlines: false
        });
    };

    var swig_highlight = function(input, lang) {
        if (typeof(lang) !== 'undefined') {
            if (lang === 'html') {
                input = swig_beautify(input);
            }
            return hljs.highlight(lang, input).value;
        }
        return hljs.highlightAuto(input).value;
    };
    swig_highlight.safe = true;


    grunt.initConfig({
        pkg: pkg,

        clean: {
            dist: ['dist'],
            www: ['_www']
        },

        connect: {
            dev: {
                options: {
                    base: ['_www'],
                    port: 8000,
                    hostname: '*',
                    livereload: 35729
                }
            }
        },

        copy: {
            www_js: {
                src: 'www/script.js',
                dest: '_www/js/script.js'
            },
            www_jquery: {
                src: 'node_modules/jquery/dist/jquery.min.js',
                dest: '_www/js/jquery.min.js'
            }
        },

        swig: {
            html: {
                expand: true,
                cwd: 'www/templates',
                src: ['*.html'],
                dest: '_www'
            },
            options: {
                filters: {
                    beautify: swig_beautify,
                    highlight: swig_highlight
                },
                tags: {
                    'codesample': {
                        parse: function(str, line, parser) {
                            parser.on('*', function(token) {
                                this.out.push(token.match);
                            });
                            return true;
                        },
                        compile: function(compiler, args, content, parents, options, blockName) {
                            var val = '(function() {\n' +
                                '  var _output = "";\n' +
                                compiler(content, parents, options, blockName) +
                                '  return _output;\n' +
                                '})()';

                            var out = [];
                            if (args.indexOf('noblock') !== -1) {
                                out.push(compiler(content, parents, options));
                            } else {
                                out.push('_output += "<div class=\\"example example-with-code\\">"');
                                out.push(compiler(content, parents, options));
                                out.push('_output += "</div>"');
                            }

                            out.push('_output += "<pre class=\\"example example-toggle\\">"');
                            out.push('_output += _filters["highlight"](' + val + ', "html")');
                            out.push('_output += "</pre>"');

                            return out.join(';\n') + ';';
                        },
                        ends: true,
                        blockLevel: true
                    }
                }
            }
        },

        stylus: {
            options: {
                compress: false,
                banner: '/*!\n' +
                        ' * <%= pkg.name %>\n' +
                        ' * Version: <%= pkg.version %>\n' +
                        ' *\n' +
                        ' * Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %> and contributors\n' +
                        ' * Released under the <%= pkg.license %> license\n' +
                        ' *\n' +
                        ' * Date: <%= grunt.template.today("isoUtcDateTime") %>\n' +
                        ' */\n'
            },
            dist: {
                files: {
                    'dist/sunrise.css': 'src/sunrise.styl'
                }
            },
            distmin: {
                files: {
                    'dist/css/sunrise.min.css': 'src/sunrise.styl'
                },
                options: {
                    compress: true,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - '+
                    '<%= grunt.template.today("isoUtcDateTime") %> - '+
                    '<%= pkg.author.name %> and contributors. <%= pkg.license %> license. */\n'
                }
            },
            www: {
                files: {
                    '_www/css/docs.css': 'www/docs.styl',
                    '_www/css/sunrise.css': 'src/sunrise.styl'
                }
            }
        },

        watch: {
            html: {
                files: ['www/templates/**'],
                tasks: ['swig:html']
            },
            media: {
                files: ['www/*.js'],
                tasks: ['copy:www_js']
            },
            stylus: {
                files: ['src/**', 'www/docs.styl'],
                tasks: ['stylus:www']
            },
            options: {
                livereload: 35729
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-swig2');

    grunt.registerTask('www', ['clean:www', 'swig', 'copy', 'stylus:www']);
    grunt.registerTask('dist', ['clean:dist', 'stylus:dist']);
    grunt.registerTask('runserver', ['www', 'connect:dev', 'watch']);
};
