'use strict';
const fs = require('fs');

const stylus = require('stylus');
const Evaluator = require('stylus/lib/visitor/evaluator');

//
// Write file only when content is different
//
module.exports.writeIfDifferent = function(destination, contents, options) {
  if (fs.existsSync(destination) && fs.readFileSync(destination) == contents) {
    return false;
  }

  fs.writeFileSync(destination, contents, options);
  return true;
};


//
// Custom stylus rendered with fail first on undefined variables
//
function CustomEvaluator(root, options) {
  options = options || {};
  Evaluator.call(this, root, options);
}

CustomEvaluator.prototype.__proto__ = Evaluator.prototype;

CustomEvaluator.prototype.visit = function(node, fn) {
  let res = Evaluator.prototype.visit.call(this, node, fn);
  if (node.nodeName == 'ident' && node.name[0] == '$' && !this.isDefined(node).val) {
    throw new Error(`${node.name} is not defined.`);
  }
  return res;
}


module.exports.parseStylus = function(input_file) {
  let options = {
    Evaluator: CustomEvaluator
  };

  return new Promise((resolve, reject) => {
    stylus(fs.readFileSync(input_file, 'utf-8'), options)
      .set('filename', input_file)
      .render(function(err, css) {
        if (err) {
          reject(err);
        } else {
          resolve(css);
        }
      });
  });
};
