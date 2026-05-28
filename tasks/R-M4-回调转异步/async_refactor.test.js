const { describe, it } = require('node:test');
const assert = require('node:assert').strict;
const path = require('path');
const fs = require('fs/promises');
const { processFiles, readFileWithRetry } = require('./async_refactor.js');

describe('processFiles (async/await)', () => {
  it('should return file sizes for existing files', async () => {
    const thisFile = path.resolve(__dirname, 'async_refactor.test.js');
    const results = await processFiles([thisFile]);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].file, thisFile);
    assert.ok(results[0].content > 0);
  });

  it('should handle empty paths array', async () => {
    const results = await processFiles([]);
    assert.deepStrictEqual(results, []);
  });
});

describe('readFileWithRetry', () => {
  it('should read existing file', async () => {
    const thisFile = path.resolve(__dirname, 'async_refactor.test.js');
    const content = await readFileWithRetry(thisFile);
    assert.ok(content.length > 0);
  });

  it('should throw after retries for missing file', async () => {
    await assert.rejects(
      () => readFileWithRetry('/nonexistent/file.txt', 2),
      { code: 'ENOENT' }
    );
  });
});
