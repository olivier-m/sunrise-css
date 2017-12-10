'use strict';
const argparse = require('argparse');
const fs = require('fs');
const shell = require('shelljs');
const path = require('path');

const stylus = require('stylus');

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const csso = require('csso');

const common = require('./common.js');

function to_css(input_file) {
  return common.parseStylus(input_file)
  .then(css => {
    //
    // Autoprefixer
    //
    return postcss()
      .use(autoprefixer({
        remove: false,
        browsers: ['> 5%', 'last 5 versions', 'Firefox ESR', 'ie 8', 'ie 9']
      }))
      .process(css).then(result => {
        console.log(' < autoprefixer');
        result.warnings().forEach(function(warn) {
          console.warn(warn.toString());
        });
        return result.css
      })
  });
};


if (require.main === module) {
  let parser = argparse.ArgumentParser({
    description: 'compile templates'
  });
  parser.addArgument('source', {
    help: 'Source file'
  });
  parser.addArgument('dest', {
    help: 'Output file'
  });
  parser.addArgument('-m', {
    dest: 'minify',
    defaultValue: false,
    action: 'storeTrue',
    help: 'Generate minified version'
  });

  let args = parser.parseArgs();

  if (!fs.existsSync(args.source)) {
    console.error('Source "' + args.source + '" does not exist.')
    process.exit(1);
  }
  shell.mkdir('-p', path.dirname(args.dest));

  to_css(args.source)
  .then(css => {
    let dest_min = path.basename(args.dest, path.extname(args.dest)) + '.min' + path.extname(args.dest);
    dest_min = path.join(path.dirname(args.dest), dest_min)

    if (common.writeIfDifferent(args.dest, css, {'encoding': 'utf-8'})) {
      console.log(' > css: ' + args.dest);
    }

    if (args.minify) {
      let css_min = csso.minify(css).css;
      if (common.writeIfDifferent(dest_min, css_min, {'encoding': 'utf-8'})) {
        console.log(' > css: ' + dest_min);
      }
    } else {
      shell.rm('-f', dest_min)
    }

  })
  .catch(err => {
    console.error(err.toString());
  })
}
