# Human Baseline Controlled Experiment Design

## Supplement to: An Empirical Evaluation of AI-Powered Coding Agents

---

## 1. Motivation and Rationale

The primary evaluation in this paper measures Claude Code + DeepSeek V4 against 18 programming tasks. Without a human baseline, readers cannot assess whether the AI's performance is impressive, adequate, or poor relative to the current standard of practice. This protocol describes a controlled experiment to collect human developer baseline data on a stratified subset of the 18 tasks, enabling direct statistical comparison.

---

## 2. Task Selection

### 2.1 Sampling Strategy

From the full corpus of 18 tasks, we select **6 representative tasks** using stratified purposive sampling. The stratification ensures coverage of all four task types (Algorithmic, Refactoring, Debugging, Full-stack) and all three difficulty levels (Simple, Medium, Hard). Within each stratum, tasks are chosen to maximise ecological validity --- i.e., they resemble realistic day-to-day programming scenarios rather than artificial puzzles.

### 2.2 Selected Tasks

| Task ID | Type | Difficulty | Description |
|---------|------|------------|-------------|
| **S1** | Algorithmic | Simple | FizzBuzz (extended variant with configurable rules) |
| **S3** | Refactoring | Simple | Extract and modularise a monolithic validation function |
| **M1** | Debugging | Medium | Fix a multi-threaded race condition in a counter application |
| **M4** | Full-stack | Medium | Implement a paginated search endpoint + minimal frontend table |
| **H1** | Algorithmic | Hard | Implement an LRU cache with O(1) get/put and thread safety |
| **H2** | Full-stack | Hard | Build a real-time collaborative todo list (WebSocket + conflict resolution) |

### 2.3 Justification

- **S1 (Algorithmic, Simple):** Serves as a litmus test for basic programming competence. Any developer who cannot complete this within the time limit would be flagged as a screening failure.
- **S3 (Refactoring, Simple):** Tests code comprehension and hygiene --- skills that are often claimed to be human strengths. Provides contrast with AI's pattern-matching approach.
- **M1 (Debugging, Medium):** Debugging multi-threaded code is a known human pain point. The comparison here is particularly informative: if AI outperforms humans by a wide margin, it suggests a genuine advantage rather than a ceiling effect.
- **M4 (Full-stack, Medium):** Full-stack tasks require context switching between frontend and backend concerns. This task tests whether humans integrate layers faster than an agent operating on the whole codebase.
- **H1 (Algorithmic, Hard):** Classic CS interview problem. High ceiling for optimisation skill. Reveals the upper bound of human algorithmic performance vs. AI.
- **H2 (Full-stack, Hard):** Real-time collaboration with conflict resolution touches distributed systems concepts. It is the most complex task in the subset and serves as a stress test for both human and AI.

This 6-task subset covers 4/4 task types and 3/3 difficulty levels while keeping the per-participant time commitment manageable (~3.5 hours total, see Section 4).

---

## 3. Participant Recruitment and Screening

### 3.1 Target Profile

- **N:** 3--5 participants (target N=5 to mitigate dropout).
- **Experience:** 2+ years of professional software development.
- **Skill distribution:** At least 2 participants should have 5+ years of experience to capture the senior end. The remainder can be junior--mid (2--4 years).
- **Tech stack familiarity:** Participants must have working knowledge of Python and JavaScript/TypeScript (the two languages used in the task suite). Screening includes a short self-assessment.

### 3.2 Recruitment Channels

- Personal professional network of the authors.
- Local university CS department alumni mailing list.
- Participants are **not** drawn from the same institution as the AI evaluation team to avoid contamination.

### 3.3 Screening Procedure

1. Short online questionnaire (5 min): years of experience, self-rated proficiency in Python/JS, availability.
2. A 10-minute paid screening task (a trivial bug fix) to verify baseline competence.
3. Participants who fail the screening task receive a partial inconvenience fee and are dismissed.

### 3.4 Ethics and Compensation

- All participants sign an informed consent form (Appendix A).
- Compensation: $50 USD per hour (or local equivalent), prorated. Estimated total per participant ~3.5 hours = $175.
- Participants are informed that their code will be anonymised and published as part of an academic study.
- IRB approval status: [to be completed].

---

## 4. Experimental Procedure

### 4.1 Environment Setup

Each participant works on a **dedicated machine** (or their own laptop with a pre-configured VM image) with:

- OS: Ubuntu 22.04 LTS (or macOS equivalent).
- Editor: Participants may use their preferred editor/IDE (VS Code, IntelliJ, Vim, etc.).
- Language runtimes: Python 3.11, Node.js 20 LTS.
- Browser: Chrome/Firefox (for full-stack tasks).
- Screen recording software (e.g., OBS Studio) runs in the background with participant consent.

### 4.2 Permitted and Prohibited Tools

| Permitted | Prohibited |
|-----------|------------|
| Web search engine (Google, Stack Overflow, MDN, etc.) | AI code generation tools (GitHub Copilot, Claude Code, ChatGPT, Cursor, etc.) |
| Official documentation (Python docs, MDN, React docs, etc.) | AI-powered autocomplete (TabNine, Codeium, etc.) |
| Personal notes, cheatsheets | Asking another person for help |
| Standard library reference | Accessing pre-written solutions (LeetCode, GitHub gists with solutions) |
| Debugger (pdb, Chrome DevTools) | |
| Version control (git) for personal checkpointing | |

Participants are explicitly instructed and sign a declaration that they will not use AI tools. An **optional automated monitor** (e.g., a script that checks for known AI tool processes) can be run as a secondary compliance check.

### 4.3 Task Presentation

Tasks are presented sequentially on a web-based dashboard:

1. **Task description** (same wording as given to the AI).
2. **Starter code** (same repository state as the AI received).
3. **Acceptance criteria** checklist (visible at all times).
4. **Time remaining** countdown.

### 4.4 Time Limits

Per task:

| Difficulty | Time Limit | Rationale |
|------------|------------|-----------|
| Simple (S1, S3) | 15 min | Trivial tasks --- a competent developer should finish well under this. |
| Medium (M1, M4) | 30 min | Moderate complexity --- allows room for debugging and iteration. |
| Hard (H1, H2) | 60 min | Substantial design + implementation. Extended time prevents floor effects. |

If a participant exceeds the time limit, the task is recorded as **failed** and they move to the next task.

### 4.5 Session Flow

```
Session A (~1 h)   Session B (~1 h)     Session C (~1.5 h)
[S1]  ── 5 min gap ──  [M1]  ── 10 min break ──  [H1]
[S3]                   [M4]                      [H2]
```

- Participants may take optional short breaks between sessions.
- Total wall-clock time: ~3.5 hours.
- A post-session debrief (10 min) collects subjective difficulty ratings and qualitative feedback.

### 4.6 Data Collected Per Task

| Variable | Type | Source |
|----------|------|--------|
| Completion (pass/fail) | Binary | Automated test suite |
| Time to completion | Continuous (seconds) | Dashboard timer (stops when tests pass) |
| Lines of code added/modified | Count | `git diff --stat` |
| Number of test-runs triggered | Count | Keystroke / IDE plugin logging |
| Subjective difficulty (1--5) | Ordinal | Post-task questionnaire |

---

## 5. Comparison Metrics

### 5.1 Primary Metrics

| Metric | Human Baseline | Claude Code + DeepSeek V4 |
|--------|----------------|--------------------------|
| **Completion rate** | % of tasks passed | 100% (by design of the main eval) |
| **Mean completion time** | Arithmetic mean across successful attempts | Arithmetic mean across successful attempts |
| **Code size (LoC)** | Mean LoC delta | Mean LoC delta |

### 5.2 Qualitative Code Quality Rubric

Each submitted solution is independently rated by two authors (blinded to human/AI provenance) on a 1--5 Likert scale for each dimension:

| Dimension | 1 | 2 | 3 | 4 | 5 |
|-----------|---|---|---|---|---|
| **Readability** | Unreadable | Poor structure | Adequate | Clear | Exemplary |
| **Correctness** | Fails tests | Partial pass | All tests pass | + edge cases | + invariants |
| **Efficiency (time)** | >O(n^2) | O(n^2) | O(n log n) | O(n) | O(1) or optimal |
| **Robustness** | No error handling | Minimal checks | Basic try/catch | Input validation | Production-grade |

Inter-rater reliability is measured by Cohen's kappa; disagreements of 2+ points are resolved by discussion.

### 5.3 Contrast Visualisations

- **Beeswarm / strip plot:** Individual completion times overlaid with human mean and AI mean per task.
- **Radar chart:** Human vs. AI across the four code-quality dimensions (aggregated across tasks).
- **Bar chart:** Completion rate with 95% CI (Wilson interval) per task for humans; a single horizontal line for AI.

---

## 6. Statistical Analysis Plan

### 6.1 Hypothesis Tests

All tests are two-tailed with alpha = .05, unless otherwise noted. No correction for multiple comparisons is applied to keep the analysis exploratory (perceived as the first human-vs-AI comparison on this benchmark); a Bonferroni-adjusted sensitivity analysis is provided in the appendix.

#### 6.1.1 Completion Rate: Fisher's Exact Test

- **Null hypothesis (H0):** Human and AI completion rates are equal for a given task.
- **Method:** Fisher's exact test (2x2 contingency table: human pass/fail vs. AI pass/fail).
- **Rationale:** Fisher's exact test does not rely on asymptotic approximations, which is critical when human N is small (3--5). If all AI attempts pass (100%), the table has a zero cell; Fisher's exact test handles this natively.

```
            Pass  Fail
Human         a     b
AI            c     0  (since AI = 100%)
```

If the same human participants complete multiple tasks, we note that observations are not strictly independent. A secondary analysis using a mixed-effects logistic regression (participant as random intercept) is reported in the appendix, but Fisher's exact test remains the primary analysis for simplicity and transparency.

#### 6.1.2 Completion Time: Mann-Whitney U Test

- **Null hypothesis (H0):** The distributions of completion times for human and AI are identical.
- **Method:** Mann-Whitney U (Wilcoxon rank-sum) test.
- **Rationale:** Times are right-skewed and the sample is small; Mann-Whitney U makes no normality assumption.
- **Effect size reported:** Common language effect size (CLES) = U / (n_h * n_ai), interpreted as "probability that a randomly sampled human completes the task faster than a randomly sampled AI trial."

#### 6.1.3 Effect Size: Cohen's d (with Hedge's g correction)

- Cohen's d = (mean_human - mean_ai) / pooled_sd.
- Because sample sizes are small (n_h <= 5), Hedge's g (multiplying d by 1 - 3/(4*(n1+n2)-9)) is preferred.
- Interpretation: 0.2 = small, 0.5 = medium, 0.8 = large.

### 6.2 Exploratory Analyses

- **Correlation** between years of experience and completion time (Spearman's rho).
- **Code verbosity comparison:** Mann-Whitney U on LoC deltas.
- **Qualitative theme extraction** from post-session debrief notes (open coding by two authors).

### 6.3 Power and Limitations

With n_h = 5 and n_ai = 1 (per task), Fisher's exact test has low power to detect anything but extreme differences. For example, if 2/5 humans fail and AI passes, p = 0.444. This is acknowledged transparently:

> "The human baseline experiment is designed to provide **descriptive benchmarks and directional evidence**, not definitive statistical inference. The small human sample limits power; results should be interpreted as indicative rather than conclusive."

The main scientific value lies in the **effect size estimates** (which can feed into future meta-analyses) and the **qualitative code comparisons**.

---

## 7. Threats to Validity

### 7.1 Internal Validity

| Threat | Mitigation |
|--------|------------|
| **Learning effects:** Participants improve across tasks. | Tasks are ordered by difficulty, not randomised, because the increasing-difficulty structure is more realistic. Secondary analysis checks for order effects. |
| **Fatigue:** Performance degrades in later tasks. | Mandatory breaks between sessions; total time limited to ~3.5 h. |
| **AI tool misuse:** Participant secretly uses Copilot, etc. | Signed declaration + optional process monitor. If detected, data is excluded. |
| **Experimenter bias:** Authors unconsciously treat human data differently. | Automated test suite determines pass/fail. Code quality ratings are blinded. |

### 7.2 External Validity

| Threat | Mitigation |
|--------|------------|
| **Small sample (N=5).** | Effect sizes reported with confidence intervals. Results labelled as exploratory. |
| **Self-selection bias:** Volunteers are unusually confident. | Compare self-rated proficiency scores to population norms if available. |
| **Lab setting:** Participants behave differently than at work. | Permitted tools mirror real work (web search, docs). No time pressure beyond the limit. |

### 7.3 Construct Validity

- **Are the tasks representative of real-world coding?** Yes --- all six tasks are adapted from real open-source repositories or production incidents.
- **Does completion rate capture all relevant aspects of quality?** No, which is why the qualitative rubric (Section 5.2) is included.

---

## 8. Data Analysis Workflow (Reproducible)

All analysis is performed in a single R Markdown / Quarto document:

```
human_analysis.qmd
├── 1. data/              # Raw CSV + test logs
│   ├── human_results.csv
│   ├── ai_results.csv
│   └── quality_ratings.csv
├── 2. scripts/
│   ├── 01_descriptive.R      # Summary tables + visualisations
│   ├── 02_fisher_test.R      # Fisher's exact per task
│   ├── 03_mann_whitney.R     # Mann-Whitney U per task
│   ├── 04_cohens_d.R         # Effect size calculation
│   └── 05_qualitative.Rmd    # Code quality analysis
└── 3. output/
    ├── figures/              # Publication-ready figures
    └── tables/               # LaTeX-formatted tables
```

A Makefile or `renv` lockfile ensures dependency reproducibility. The full repository (anonymised data + code) is published on Zenodo upon acceptance.

---

## 9. Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| IRB approval | 2--4 weeks | Approval letter |
| Participant recruitment | 2 weeks | 5 signed consent forms |
| Pilot session (1 participant) | 1 day | Protocol adjustments |
| Main data collection (5 sessions) | 1 week | Raw data + screen recordings |
| Blinded quality rating | 1 week | Filled rubric CSVs |
| Statistical analysis | 3 days | R Markdown output |
| Write-up (methods + results) | 1 week | Manuscript section draft |

---

## 10. Appendix: Sample Consent Form (Outline)

- **Title:** Human Baseline for AI Coding Agent Evaluation
- **Principal Investigator:** [Name]
- **Purpose:** To measure how human developers perform on programming tasks for comparison with an AI system.
- **Procedure:** One ~3.5-hour session with 6 programming tasks, screen recording (optional), and a short debrief.
- **Risks:** Minimal. Fatigue from extended concentration. Breaks provided.
- **Benefits:** Contribution to understanding human-AI performance differences in software engineering.
- **Compensation:** $175 (paid upon session completion).
- **Confidentiality:** All data anonymised. Screen recordings stored encrypted and deleted after analysis.
- **Withdrawal:** Participants may withdraw at any time and still receive prorated compensation.
- **Contact:** [Email]
- **Signature:** ___ Date: ___

---

## 11. References

1. Fisher, R. A. (1922). On the interpretation of chi-square from contingency tables, and the calculation of P. *Journal of the Royal Statistical Society*, 85(1), 87--94.
2. Mann, H. B., & Whitney, D. R. (1947). On a test of whether one of two random variables is stochastically larger than the other. *Annals of Mathematical Statistics*, 18(1), 50--60.
3. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Lawrence Erlbaum Associates.
4. Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, 22(158), 209--212.
5. Lakens, D. (2013). Calculating and reporting effect sizes to facilitate cumulative science. *Frontiers in Psychology*, 4, 863.
