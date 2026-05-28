# Nature 审稿意见

**稿件：** An Empirical Evaluation of AI-Powered Coding Agents: A Case Study of Claude Code with deepseek-v4-flash on Software Development Tasks

---

## 总体评价：不建议接收（Reject）

本研究对 AI 编码 Agent 在 18 个编程任务上的表现进行了系统评估，选题具有现实意义，但存在若干根本性方法论缺陷，导致结论的证据强度不足以支持在 Nature 系列期刊发表。以下按重要性排序。

---

## 1. 创新性（Novelty）：不足

**问题：** 论文的核心发现——"AI 编码 Agent 在 18 个自建任务上取得 100% 通过率"——不具备 Nature 级别的新颖性。HumanEval、SWE-bench、CodeXGLUE 等基准测试已广泛评估了 AI 的代码生成能力。将 Claude Code 框架与 DeepSeek 模型通过 API 代理组合使用，并在一组教科书级任务上进行测试，这属于增量式工程报告而非科学发现。

**建议：** 将论文定位为 Empirical Software Engineering 期刊的小型案例研究（Case Study），而非 Nature 级别的原创研究。

---

## 2. 方法严密性（Methodological Rigor）：严重不足

### 2.1 单次运行设计（致命缺陷）
18 个任务中仅执行单次运行。LLM 的输出本质上是随机的。虽然在 6 个任务上补充了 5 次重复运行，但 12/18 的任务仍为单次运行。H2 任务在重复运行中仅获得 60% 通过率，恰恰证明了单次运行评估不可靠。

### 2.2 缺乏人类基线
没有人类开发者对照实验。论文引用 HumanEval 的 96% 作为"松散参考"，但任务集不同、评估协议不同，不具备可比性。没有基线，"100% 通过率"这个核心数字就无法解读。

### 2.3 训练数据污染未控制
Two-Sum、LRU Cache、Red-Black Tree、SQL Injection 修复——所有这些任务都是公开的教科书经典问题，DeepSeek V4 的训练数据几乎必然包含这些问题的解法。论文在讨论中承认了此风险，但未做任何缓解措施。

### 2.4 Benchmark 规模不足
18 个任务、6 个状态指标，对于声称"systematic evaluation"的研究而言太少。任务的语言分布严重不均（12/18 为 JavaScript），Hard 级别仅 4 个任务。

### 2.5 实验对象界定不清
"Claude Code with deepseek-v4-flash" 是一种非标准配置（通过 API 代理实现），既不是 Claude Code 的官方配置，也不是 DeepSeek 的推荐使用方式。作者未说明代理层的实现细节、tool calling 的兼容性、system prompt 是否被改写。

---

## 3. 结果解释（Results Interpretation）：偏乐观

100% 通过率可能是 benchmark 难度不足的体现，而非 Agent 能力卓越的证据。论文虽在 Limitations 中提及 ceiling effect，但摘要和结论部分仍以 100% 为核心卖点。变异性分析中 H2 的 60% 通过率才是有信息量的发现，但被降级为次要结果。

**建议：** 重新组织叙事，将 H2 的变异性发现作为核心结果。

---

## 4. 图表质量（Figures and Tables）：一般

Fig. 2-5 缺乏数据定义和方法说明（time taken 如何测量？token consumption 是 input 还是 output？interaction turns 的定义？regression 模型？）。

Table VI 的 Variance 列对 H2 报告 2.56，但未说明这是否为总体方差或样本方差，也未提供置信区间。

---

## 5. 语言表达（Language and Presentation）：可接受但 AI 痕迹明显

论文结构清晰，语言流畅，但存在典型的 AI 生成学术文本特征：过度使用"This suggests that"、"We caution that"、"Our findings indicate"等模板化句式。Discussion 部分写得像"万能套话"，缺乏真实研究者的"钝感"。

---

## 6. 可复现性（Reproducibility）：严重不足

实验所用的 API 代理配置、DeepSeek 模型版本、Claude Code 版本、temperature 等采样参数均未完整披露。任务的具体 prompt、测试代码、生成代码、运行日志未公开。独立的第三方无法复现这项研究。

---

## 综合决定：Reject

**主要原因：**
1. 创新性不足以支撑 Nature 级别发表
2. 单次运行 + 无人类基线 = 结论证据强度不足
3. 训练数据污染未缓解
4. 可复现性信息严重缺失

**建议改投：** 如果补充完整可复现材料并将定位调整为小型案例研究，可考虑投稿 Empirical Software Engineering (EMSE) 或 Journal of Systems and Software (JSS)。
