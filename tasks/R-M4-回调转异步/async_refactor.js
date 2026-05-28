/**
 * ============================================================
 *  重构前（回调嵌套 / callback hell）
 * ============================================================
 *
 * function fetchUserData(userId, callback) {
 *   const fs = require('fs');
 *   fs.readFile(`./data/users/${userId}.json`, 'utf8', (err, userData) => {
 *     if (err) return callback(err);
 *     const user = JSON.parse(userData);
 *
 *     fs.readdir(`./data/orders/${userId}`, (err, orderFiles) => {
 *       if (err) return callback(err);
 *
 *       let orders = [];
 *       let pending = orderFiles.length;
 *       if (pending === 0) return callback(null, { user, orders });
 *
 *       orderFiles.forEach((file) => {
 *         fs.readFile(`./data/orders/${userId}/${file}`, 'utf8', (err, data) => {
 *           if (err) return callback(err);
 *           orders.push(JSON.parse(data));
 *           if (orders.length === pending) {
 *             callback(null, { user, orders });
 *           }
 *         });
 *       });
 *     });
 *   });
 * }
 *
 * // 调用示例（回调地狱）：
 * // fetchUserData(42, (err, result) => {
 * //   if (err) return console.error(err);
 * //   console.log(result.user, result.orders);
 * // });
 */

// ============================================================
//  重构后：async / await
// ============================================================

const fs = require('fs/promises');
const path = require('path');

/**
 * 获取用户信息和订单数据（并行读取）。
 * @param {number|string} userId
 * @returns {Promise<{user: object, orders: object[]}>}
 */
async function fetchUserData(userId) {
  const dataDir = path.resolve(__dirname, 'data');

  const [userData, orderFiles] = await Promise.all([
    fs.readFile(path.join(dataDir, 'users', `${userId}.json`), 'utf8'),
    fs.readdir(path.join(dataDir, 'orders', `${userId}`)).catch(() => []),
  ]);

  const user = JSON.parse(userData);

  const orders = await Promise.all(
    orderFiles.map((file) =>
      fs.readFile(path.join(dataDir, 'orders', `${userId}`, file), 'utf8')
        .then(JSON.parse)
    )
  );

  return { user, orders };
}

/**
 * 批量处理文件，返回文件名和内容大小。
 * @param {string[]} paths
 * @returns {Promise<{file: string, content: number}[]>}
 */
async function processFiles(paths) {
  const results = await Promise.all(paths.map((p) => fs.readFile(p, 'utf8')));
  return results.map((r, i) => ({ file: paths[i], content: r.length }));
}

/**
 * 带重试机制的读取（展示 async/await 在控制流上的优势）。
 * @param {string} filepath
 * @param {number} retries
 * @returns {Promise<string>}
 */
async function readFileWithRetry(filepath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fs.readFile(filepath, 'utf8');
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Retry ${attempt}/${retries} for ${filepath}: ${err.message}`);
    }
  }
}

module.exports = { fetchUserData, processFiles, readFileWithRetry };
