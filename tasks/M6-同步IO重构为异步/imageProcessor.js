const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

class ImageProcessor {
  /**
   * 批量处理图片 — 异步并发版本
   *
   * @param {string[]} inputPaths - 输入图片路径数组
   * @param {string} outputDir - 输出目录
   * @param {Object} options - 处理选项
   * @param {Object} [options.resize] - 缩放尺寸 { width, height }
   * @param {boolean} [options.grayscale] - 是否转灰度
   * @param {number} [options.quality] - JPEG 质量 (1-100)
   * @param {number} [options.concurrency=3] - 最大并发数
   * @param {(completed: number, total: number) => void} [onProgress] - 进度回调
   * @returns {Promise<{ successful: Array<{input:string, output:string, size:number}>, failed: Array<{input:string, error:string}> }>}
   */
  async processImages(inputPaths, outputDir, options, onProgress) {
    const concurrency = options.concurrency ?? 3;
    const total = inputPaths.length;
    const successful = [];
    const failed = [];
    let completed = 0;

    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });

    // 并发调度器：每次最多运行 concurrency 个任务
    const processOne = async (inputPath) => {
      try {
        const inputBuffer = await fs.readFile(inputPath);
        const fileName = path.basename(inputPath);
        const outputPath = path.join(outputDir, fileName);

        let pipeline = sharp(inputBuffer);

        if (options.resize) {
          pipeline = pipeline.resize(options.resize.width, options.resize.height);
        }

        if (options.grayscale) {
          pipeline = pipeline.grayscale();
        }

        if (options.quality) {
          pipeline = pipeline.jpeg({ quality: options.quality });
        }

        const outputBuffer = await pipeline.toBuffer();
        await fs.writeFile(outputPath, outputBuffer);

        successful.push({
          input: inputPath,
          output: outputPath,
          size: outputBuffer.length,
        });

        console.log(`处理完成: ${inputPath}`);
      } catch (err) {
        failed.push({
          input: inputPath,
          error: err.message,
        });
        console.error(`处理失败: ${inputPath} — ${err.message}`);
      } finally {
        completed++;
        if (typeof onProgress === 'function') {
          onProgress(completed, total);
        }
      }
    };

    // 分块并发执行
    const results = await this._runWithConcurrency(
      inputPaths,
      concurrency,
      processOne,
    );

    return { successful, failed };
  }

  /**
   * 并发控制器：将任务数组分片，每批最多 concurrency 个并行
   */
  async _runWithConcurrency(items, concurrency, fn) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map((item) => fn(item)));
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * 获取图片元数据
   * @param {string} imagePath
   * @returns {Promise<Object>} sharp metadata 对象
   */
  async getMetadata(imagePath) {
    const buffer = await fs.readFile(imagePath);
    return sharp(buffer).metadata();
  }
}

module.exports = { ImageProcessor };
