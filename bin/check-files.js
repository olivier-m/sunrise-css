'use strict';
const argparse = require('argparse');
const fs = require('fs');
const glob = require('glob');

const common = require('./common.js');

function check_styl_file(input_file) {
  return common.parseStylus(input_file);
}

function check_files(source, args) {
  let files;
  if (/\.styl$/.test(source)) {
    files = [source];
  }
  else {
    files = glob.sync(`${source}/**/*.styl`);
  }

  for (let f of files) {
    check_styl_file(f)
      .then(r => {
        console.log(`OK:  ${f}`);
      })
      .catch(err => {
        console.log(`ERR: ${f}`);
        if (args.verbose) {
          console.error(err.toString());
        }
      });
  }
}


if (require.main === module) {
  let parser = argparse.ArgumentParser({
    description: 'check all stylus files'
  });
  parser.addArgument('source', {
    help: 'Source file'
  });
  parser.addArgument('-v', {
    dest: 'verbose',
    defaultValue: false,
    action: 'storeTrue'
  });

  let args = parser.parseArgs();

  if (!fs.existsSync(args.source)) {
    console.error('Source "' + args.source + '" does not exist.')
    process.exit(1);
  }

  check_files(args.source, args);
}
