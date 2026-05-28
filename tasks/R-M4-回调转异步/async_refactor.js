const fs = require('fs/promises');
async function processFiles(paths) {
  const results = await Promise.all(paths.map(p => fs.readFile(p, 'utf8')));
  return results.map((r, i) => ({ file: paths[i], content: r.length }));
}