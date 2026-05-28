# AI Coding Agent Empirical Evaluation — Supplementary Materials

This repository contains the supplementary materials for the paper:

**"An Empirical Evaluation of AI-Powered Coding Agents: A Case Study of Claude Code with deepseek-v4-flash on Software Development Tasks"**

## Repository Structure

```
├── paper/                    # Paper manuscript (LaTeX source + PDF)
│   ├── manuscript.tex        # LaTeX source
│   └── manuscript.pdf        # Compiled PDF
├── tasks/                    # 50 programming tasks
│   ├── S1-两数之和/          # Algorithm: Two-Sum (Simple, JS)
│   ├── M1-实现LRU缓存/       # Algorithm: LRU Cache (Medium, JS)
│   ├── H1-实现红黑树插入/    # Algorithm: RB-Tree (Hard, JS)
│   ├── A-S3-合并有序数组/    # Algorithm (Simple, JS)
│   ├── B-H2-修复Goroutine泄漏/ # Bug Fix (Hard, Go)
│   └── ...                   # 50 tasks × (README + 验收标准 + template)
├── data/                     # Experimental data
│   ├── experiment_results.csv # Primary results
│   └── variability/          # 42 repeated-run records
├── scripts/                  # Analysis scripts
│   ├── analyze_results.py    # Statistical analysis
│   └── generate_charts.py    # Figure generation
└── README.md
```

## Replication

To replicate the experiment:
1. Configure `ANTHROPIC_BASE_URL` to point to a DeepSeek-compatible API endpoint
2. Set model to `deepseek-v4-flash`
3. Run tasks using `scripts/run_experiment.sh`

## License

MIT
