# 将同步 IO 重构为异步

## 任务描述

我有一个 Node.js 图片处理服务，当前使用同步 API 读取文件、处理、再写回文件。当并发请求多的时候，整个服务就卡住了。帮我重构为异步版本，提高并发处理能力。

## 当前代码

```javascript
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageProcessor {
  /**
   * 批量处理图片
   * @param {string[]} inputPaths - 输入图片路径数组
   * @param {string} outputDir - 输出目录
   * @param {Object} options - 处理选项
   */
  processImages(inputPaths, outputDir, options) {
    const results = [];

    for (const inputPath of inputPaths) {
      // 同步读取
      const inputBuffer = fs.readFileSync(inputPath);

      // 同步处理
      const fileName = path.basename(inputPath);
      const outputPath = path.join(outputDir, fileName);

      let image = sharp(inputBuffer);

      if (options.resize) {
        image = image.resize(options.resize.width, options.resize.height);
      }

      if (options.grayscale) {
        image = image.grayscale();
      }

      if (options.quality) {
        image = image.jpeg({ quality: options.quality });
      }

      // 同步写入
      const outputBuffer = image.toBuffer();  // 这是同步吗？需要确认
      fs.writeFileSync(outputPath, outputBuffer);

      results.push({
        input: inputPath,
        output: outputPath,
        size: outputBuffer.length
      });

      console.log(`处理完成: ${inputPath}`);
    }

    return results;
  }

  /**
   * 获取图片元数据
   */
  getMetadata(imagePath) {
    const buffer = fs.readFileSync(imagePath);
    // sharp 的 metadata 返回 promise
    // 但这里用了同步方式，导致调用者拿不到结果
    const metadata = sharp(buffer).metadata();
    return metadata;
  }
}

module.exports = { ImageProcessor };
```

## 要求

1. 将所有 `readFileSync` / `writeFileSync` 改为异步版本（`fs.promises`）
2. `processImages` 改为返回 Promise，支持并发处理多个图片（控制并发数）
3. 添加错误处理，单个图片处理失败不应影响其他图片
4. 使用 `Promise.allSettled` 或类似机制处理批量结果
5. 添加进度回调支持

## 语言要求

Node.js JavaScript。
