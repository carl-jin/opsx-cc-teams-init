#!/usr/bin/env node

const { init } = require('../lib/init');

init().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
