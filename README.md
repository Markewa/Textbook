# Counting Steps

An e-textbook for bachelor's students on the mathematical analysis of nonrecursive and recursive algorithms (Levitin, *Introduction to the Design and Analysis of Algorithms*, sections 2.3–2.5).

**Authors:** Karim M., Alaidar K., Akhmetsharip S.

## Contents

- **Part 0. Before you start.** Input size, basic operation, order of growth, O / Ω / Θ, worst, best and average case. Entry quiz (5 questions).
- **Module 1. Nonrecursive algorithms.** The plan of analysis, summation formulas, 7 worked examples (2 of them original), the average case, typical mistakes, empirical check. Quiz (10 questions) and 13 problems.
- **Module 2. Recursive algorithms.** Recurrences, backward substitution, induction, 5 worked examples (2 of them original), naive Fibonacci, recursion vs iteration. Quiz (10 questions) and 13 problems.
- **Reference.** Glossary, sources, quiz results.

Every problem has a hint, an answer and a full solution. Each module has interactive figures and a counter lab.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The textbook page |
| `css/style.css` | Styles (light and dark theme) |
| `js/main.js` | Quizzes, figures, counter labs, table of contents, saved results |
| `js/mathjax-config.js` | Settings for formula rendering (MathJax 3) |
| `code/analysis_counters.py` | Python program that checks every formula in the textbook by counting operations |
| `code/README.txt` | How to run the program |

## Run locally

Open `index.html` in a browser. An internet connection is needed for fonts and formulas (Google Fonts and MathJax from a CDN).

To check the formulas:

```
python3 code/analysis_counters.py
```

The last line printed should be `All formulas confirmed.`

## Quiz results

Quiz scores are saved in the reader's own browser (localStorage). Nothing is sent to a server.
