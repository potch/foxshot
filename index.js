#!/usr/bin/env node

const program = require('commander');
const urllib = require('url');
const package = require('./package.json');

function collect(val, list) {
  let split = val.match(/^(\d+)x(\d+)$/);
  if (!split) {
    console.warn(`invalid dimensions "${val}", will be ignored.`);
  } else {
    list.push([
      parseInt(split[1], 10),
      parseInt(split[2], 10)
    ]);
  }
  return list;
}

program
  .version(package.version)
  .usage('[options] <url>')
  .option('-c, --channel [channel]', 'Use specified channel [release]', 'release')
  .option('-d, --dimension [size]', 'Capture at the specified dimensons [1024x768]', collect, [])
  .option('-p, --prefix [prefix]', 'Output prefix e.g. prefix_[size].png [screenshot]', 'screenshot')
  .parse(process.argv);


if (!program.dimension.length) {
  console.error('no valid dimensions provided, defaulting to 1024x768');
  program.dimension = [[1024, 768]];
}

const VALID_CHANNELS = ['nightly', 'beta', 'release'];

if (VALID_CHANNELS.indexOf(program.channel) === -1) {
  console.error(`invalid channel "${program.channel}", using release`);
}

if (program.args[0]) {
  const capture = require('./capture').capture;
  let url = program.args[0];
  let parsed = urllib.parse(url);
  if (!parsed.protocol) {
    console.error('no protocol provided, assuming http://');
    url = 'http://' + url;
  }
  capture({
    channel: program.channel,
    dimensions: program.dimension,
    url: url,
    prefix: program.prefix || 'screenshot'
  });
} else {
  console.error('No URL provided.');
}
