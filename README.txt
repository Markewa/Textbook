Empirical code for the e-textbook "Counting Steps"
==================================================

File: analysis_counters.py  (Python 3.8+, standard library only)

What it does
  Implements every algorithm from the textbook (worked examples and problems of
  both modules) with a counter placed at its basic operation, runs it for several
  input sizes n, and compares the count with the closed formula derived in the
  textbook. Any mismatch stops the program with an AssertionError.

How to run
  python3 analysis_counters.py          # prints a table per formula
  python3 analysis_counters.py --plot   # also saves empirical_charts.png
                                        # (needs: pip install matplotlib)

Expected result
  Tables with "yes" in the last column, ending with the line
      All formulas confirmed.

Solutions to the textbook's empirical problems
  Module 1, E1 (triple loop vs n(n+1)(n+2)/6) and Module 2, E1 (naive, memoized and
  iterative Fibonacci) are given in full inside the textbook's solution blocks; the
  same functions are b1_triple_loop, fib_naive, fib_memo and fib_iter in this file.
