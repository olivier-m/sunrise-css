/*global module:true, require:true */

module.exports = function(grunt) {
    'use strict';

    var pkg = grunt.file.readJSON('package.json');

    var beautify_html = require('js-beautify').html;
    var hljs = require('highlight.js');
    var path = require('path');

    var src_dir = './src';

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

        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'Firefox ESR', 'ie 8', 'ie 9']
            },
            dist: {
                src: ['dist/*.css']
            },
            www: {
                src: ['_www/css/sunrise.css', '_www/css/docs.css']
            }
        },

        clean: {
            dist: ['dist'],
            www: ['_www']
        },

        connect: {
            dev: {
                options: {
                    base: ['_www'],
                    port: 7000,
                    hostname: '*',
                    livereload: 35729
                }
            }
        },

        copy: {
            media: {
                expand: true,
                cwd: 'www',
                src: ['media/**'],
                dest: '_www/'
            }
        },

        csso: {
            dist: {
                options: {
                    report: 'gzip',
                    banner: '/*! <%= pkg.name %> <%= pkg.version %> Copyright <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %> and contributors\n' +
                            ' * Released under the <%= pkg.license %> license - <%= grunt.template.today("isoUtcDateTime") %>\n' +
                            ' */\n'
                },
                files: {
                    'dist/sunrise.min.css': ['dist/sunrise.css'],
                    'dist/sunrise-forms.min.css': ['dist/sunrise-forms.css']
                }
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
                banner: '/*\n' +
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
                    'dist/sunrise.css': path.join(src_dir, 'styl/sunrise.styl'),
                    'dist/sunrise-forms.css': path.join(src_dir, 'styl/modules/forms/standalone.styl')
                }
            },
            www: {
                files: {
                    '_www/css/docs.css': 'www/docs.styl',
                    '_www/css/sunrise.css': path.join(src_dir, 'styl/sunrise.styl')
                },
                options: {
                    paths: [path.join(src_dir, 'styl')]
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    'dist/js/sunrise.js': [path.join(src_dir, '**/*.js')],
                    'dist/js/sunrise.full.js': [
                        'node_modules/jquery/dist/jquery.js',
                        'node_modules/velocity-animate/velocity.js',
                        'node_modules/velocity-animate/velocity.ui.js',
                        path.join(src_dir, 'js/**/*.js')
                    ]
                }
            },
            www: {
                files: {
                    '_www/js/sunrise.web.js': [
                        'node_modules/jquery/dist/jquery.js',
                        'node_modules/velocity-animate/velocity.js',
                        'node_modules/velocity-animate/velocity.ui.js',
                        path.join(src_dir, 'js/**/*.js'),
                        'www/script.js'
                    ]
                },
                options: {
                    mangle: false,
                    compress: false,
                    beautify: true,
                    preserveComments: 'all'
                }
            }
        },

        watch: {
            html: {
                files: ['www/templates/**'],
                tasks: ['swig:html']
            },
            stylus: {
                files: [path.join(src_dir, 'styl/**/*.styl'), 'www/docs.styl'],
                tasks: ['stylus:www', 'autoprefixer:www']
            },
            js: {
                files: ['www/script.js', path.join(src_dir, 'js/**/*.js')],
                tasks: ['uglify:www']
            },
            media: {
                files: ['www/media/**'],
                tasks: ['copy:media']
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-csso');
    grunt.loadNpmTasks('grunt-swig2');

    grunt.registerTask('www', ['clean:www', 'copy', 'swig', 'stylus:www', 'autoprefixer:www', 'uglify:www']);
    grunt.registerTask('dist', ['clean:dist', 'stylus:dist', 'autoprefixer:dist', 'csso:dist', 'uglify:dist']);
    grunt.registerTask('runserver', ['www', 'connect:dev', 'watch']);
};
