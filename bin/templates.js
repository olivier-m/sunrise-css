'use strict';
const argparse = require('argparse');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const nunjucks = require('nunjucks');
const beautify_html = require('js-beautify').html;
const hljs = require('highlight.js');
const MarkdownIt = require('markdown-it');

const common = require('./common.js');

const tpl_highlight_filter = function(input, lang) {
  let res;
  if (typeof(lang) !== 'undefined') {
    if (lang === 'html') {
      input = input;
    }
    res = hljs.highlight(lang, input).value;
  } else {
    res = hljs.highlightAuto(input).value;
  }
  return new nunjucks.runtime.SafeString(res);
};


const tplCodeSampleTag = function() {
  this.tags = ['codesample'];

  this.parse = function(parser, nodes, lexer) {
    let tok = parser.nextToken();
    let args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endcodesample');

    parser.advanceAfterBlockEnd();
    return new nodes.CallExtension(this, 'run', args, [body]);
    };

    this.run = function() {
      const args = Array.prototype.slice.call(arguments);
      const context = args.shift();
      const body = args.pop();
      const html = body();

      let out = ''
      if (args.indexOf('noblock') !== -1) {
        out = html;
      } else {
        out = '<div class="example example-with-code">' + html + '</div>';
      }
      out += '\n<pre class="example example-toggle">' + tpl_highlight_filter(html) + '</pre>';

      return new nunjucks.runtime.SafeString(out);
    };
}

const tplCodeMarkdownTag = function() {
  this.tags = ['markdown'];

  this.parse = function(parser, nodes, lexer) {
    let tok = parser.nextToken();
    let args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, 'run', args);
  };

  this.run = function() {
    const args = Array.prototype.slice.call(arguments);
    const context = args.shift();
    const filename = args.pop();

    let candidate;
    context.env.loaders.forEach(l => {
      l.searchPaths.forEach(p => {
        let c = path.join(p, filename);
        if (fs.existsSync(c)) {
          candidate = c;
        }
      })
    });
    if (!candidate) {
      throw new Error('Markdown file "' + filename + '" not found');
    }

    let contents = fs.readFileSync(candidate, 'utf-8');
    let md = new MarkdownIt();
    return new nunjucks.runtime.SafeString(md.render(contents));
  }
}


if (require.main === module) {
  let parser = argparse.ArgumentParser({
    description: 'compile templates'
  });
  parser.addArgument('source', {
    help: 'Source directory'
  });
  parser.addArgument('dest', {
    help: 'Output directory'
  });
  parser.addArgument('-m', {
    defaultValue: '*.html',
    type: String,
    help: 'File patern to match'
  });

  let args = parser.parseArgs();

  if (!fs.existsSync(args.source)) {
    console.error('Source "' + args.source + '" does not exist.')
    process.exit(1);
  }
  shell.mkdir('-p', args.dest);

  let loader = new nunjucks.FileSystemLoader(args.source)
  let env = new nunjucks.Environment(loader);
  env.addFilter('highlight', tpl_highlight_filter);
  env.addExtension('CodeSample', new tplCodeSampleTag());
  env.addExtension('Markdown', new tplCodeMarkdownTag());

  const items = fs.readdirSync(args.source)
  .filter(f => {
    return f.match(/\.html$/) && fs.statSync(path.join(args.source, f)).isFile();
  })
  .forEach(f => {
    let html = env.render(f);
    let dest = path.join(args.dest, f);

    if (common.writeIfDifferent(dest, html, {'encoding': 'utf-8'})) {
      console.log(' > html: ' + dest);
    }
  });
}
