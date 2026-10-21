"""
Empirical verification for the e-textbook
"Mathematical Analysis of Algorithms: Nonrecursive and Recursive" (Levitin, Sections 2.3-2.5).

Every function below counts its BASIC OPERATION with an explicit counter.
`main()` compares each counter with the closed-form formula derived in the textbook
and prints a table. A mismatch raises AssertionError, so a clean run means every
formula in the textbook has been confirmed for all tested n.

Run:   python3 analysis_counters.py            (all checks + tables)
       python3 analysis_counters.py --plot     (also saves growth charts, needs matplotlib)
Requires only the Python 3.8+ standard library (matplotlib optional for --plot).
"""
import math
import random
import sys
from functools import lru_cache
from fractions import Fraction

sys.setrecursionlimit(10000)

# ---------------------------------------------------------------- Module 1 ---
# Worked examples (lecture)

def max_element(a):
    """Basic op: comparison a[i] > maxval.  C(n) = n - 1"""
    c, maxval = 0, a[0]
    for i in range(1, len(a)):
        c += 1
        if a[i] > maxval:
            maxval = a[i]
    return c


def unique_elements(a):
    """Basic op: comparison a[i] == a[j].  Worst C(n) = n(n-1)/2, best C(n) = 1"""
    c, n = 0, len(a)
    for i in range(n - 1):
        for j in range(i + 1, n):
            c += 1
            if a[i] == a[j]:
                return c
    return c


def matrix_multiplication(n):
    """Basic op: multiplication.  M(n) = n^3"""
    A = [[1] * n for _ in range(n)]
    B = [[1] * n for _ in range(n)]
    C = [[0] * n for _ in range(n)]
    m = 0
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] += A[i][k] * B[k][j]
                m += 1
    return m


def dependent_bound_loop(n):
    """for i = 1..n, for j = 1..i: x += 1.   C(n) = n(n+1)/2"""
    c = 0
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            c += 1
    return c


def multiplicative_loop(n):
    """i = 1; while i <= n: i = 2i.   C(n) = floor(log2 n) + 1"""
    c, i = 0, 1
    while i <= n:
        c += 1
        i *= 2
    return c


def seq_search_avg_exact(n, p):
    """Exact average number of comparisons of sequential search, computed by
    definition (sum over outcomes x probability) with exact fractions.
    Formula: C_avg(n) = p(n+1)/2 + n(1-p)"""
    p = Fraction(p)
    total = sum(Fraction(i) * p / n for i in range(1, n + 1))   # found at position i
    total += n * (1 - p)                                         # not found
    return total


# Original worked examples (not in the lecture)

def selection_sort(a):
    """Basic op: comparison a[j] < a[min].  C(n) = n(n-1)/2 for every input"""
    a, c, n = list(a), 0, len(a)
    for i in range(n - 1):
        m = i
        for j in range(i + 1, n):
            c += 1
            if a[j] < a[m]:
                m = j
        a[i], a[m] = a[m], a[i]
    assert a == sorted(a)
    return c


def poly_naive(coef, x):
    """p(x) = sum a_i x^i, x^i recomputed each time.
    Basic op: multiplication.  M(n) = (n+1)(n+2)/2 where n = degree"""
    m, p = 0, 0
    for i, ai in enumerate(coef):
        power = 1
        for _ in range(i):
            power *= x
            m += 1
        p += ai * power
        m += 1
    return p, m


def poly_horner(coef, x):
    """Horner's rule.  M(n) = n"""
    m, p = 0, coef[-1]
    for ai in reversed(coef[:-1]):
        p = p * x + ai
        m += 1
    return p, m


# Problems of Module 1

def a1_sum_squares(a):           # M(n) = n
    m, s = 0, 0
    for v in a:
        s += v * v
        m += 1
    return m


def a3_count_descents(a):        # C(n) = n - 1
    c, cnt = 0, 0
    for i in range(len(a) - 1):
        c += 1
        if a[i] > a[i + 1]:
            cnt += 1
    return c


def b1_triple_loop(n):           # C(n) = n(n+1)(n+2)/6
    c = 0
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            for k in range(1, j + 1):
                c += 1
    return c


def b2_upper_triangle(n):        # C(n) = n(n+1)/2
    c = 0
    for i in range(1, n + 1):
        for j in range(i, n + 1):
            c += 1
    return c


def b3_is_sorted(a):             # worst n-1 (sorted input), best 1
    c = 0
    for i in range(len(a) - 1):
        c += 1
        if a[i] > a[i + 1]:
            return c
    return c


def b4_double_sum(n):            # sum_{i=0}^{n-1} sum_{j=0}^{i} (i+j) = (n-1)n(n+1)/2
    return sum(i + j for i in range(n) for j in range(i + 1))


def c2a_base3_loop(n):           # floor(log3 n) + 1
    c, i = 0, n
    while i >= 1:
        c += 1
        i //= 3
    return c


def c2b_nested_log(n):           # n (floor(log2 n) + 1)
    c = 0
    for _ in range(1, n + 1):
        j = 1
        while j <= n:
            c += 1
            j *= 2
    return c


def floor_log(n, b):
    """Exact floor(log_b n) with integers (avoids floating-point error)."""
    k = 0
    while b ** (k + 1) <= n:
        k += 1
    return k


# ---------------------------------------------------------------- Module 2 ---
# Worked examples (lecture)

def factorial(n, cnt):           # M(n) = n
    if n == 0:
        return 1
    cnt[0] += 1
    return factorial(n - 1, cnt) * n


def hanoi(n, src, dst, aux, cnt):  # M(n) = 2^n - 1
    if n == 1:
        cnt[0] += 1
        return
    hanoi(n - 1, src, aux, dst, cnt)
    cnt[0] += 1
    hanoi(n - 1, aux, dst, src, cnt)


def bin_rec(n, cnt):             # A(n) = log2 n for n = 2^k ; floor(log2 n) in general
    if n == 1:
        return 1
    cnt[0] += 1
    return bin_rec(n // 2, cnt) + 1


def fib_naive(n, cnt):           # A(n) = F(n+1) - 1
    if n <= 1:
        return n
    cnt[0] += 1
    return fib_naive(n - 1, cnt) + fib_naive(n - 2, cnt)


def fib_memo(n):                 # n - 1 additions
    cnt = [0]
    memo = {0: 0, 1: 1}

    def f(k):
        if k in memo:
            return memo[k]
        cnt[0] += 1
        memo[k] = f(k - 1) + f(k - 2)
        return memo[k]
    f(n)
    return cnt[0]


def fib_iter(n):                 # n - 1 additions, O(1) memory
    cnt, a, b = 0, 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
        cnt += 1
    return cnt


def F(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


# Original worked examples

def rec_max(a, n, cnt):          # C(n) = n - 1
    if n == 1:
        return a[0]
    m = rec_max(a, n - 1, cnt)
    cnt[0] += 1
    return a[n - 1] if a[n - 1] > m else m


def fast_power(x, n, cnt):       # n = 2^k : M(n) = log2 n
    if n == 1:
        return x
    h = fast_power(x, n // 2, cnt)
    cnt[0] += 1
    return h * h


# Problems of Module 2

def rec_sum(a, n, cnt):          # A2: A(n) = n - 1
    if n == 1:
        return a[0]
    s = rec_sum(a, n - 1, cnt)
    cnt[0] += 1
    return s + a[n - 1]


def b3_cube(n, cnt):             # computes n^3 ; M(n) = 3(n-1)
    if n == 1:
        return 1
    cnt[0] += 3                  # 3*n*n (2 mult) and 3*n (1 mult)
    return b3_cube(n - 1, cnt) + 3 * n * n - 3 * n + 1


def b4_draw(n, cnt):             # calls C(n) = (3^(n+1) - 1)/2
    cnt[0] += 1
    if n == 0:
        return
    for _ in range(3):
        b4_draw(n - 1, cnt)


def c2_power_general(x, n, cnt):  # M(n) = floor(log2 n) + 1 + popcount(n), n >= 1
    if n == 0:
        return 1
    h = c2_power_general(x, n // 2, cnt)
    if n % 2 == 0:
        cnt[0] += 1
        return h * h
    cnt[0] += 2
    return h * h * x


def solve_rec(step, x0, start, n):
    """Iterate a recurrence x(k) = step(k, x(k-1)) from x(start) = x0."""
    x = x0
    for k in range(start + 1, n + 1):
        x = step(k, x)
    return x


# ------------------------------------------------------------------ checks ---

def run(cnt_fn):
    c = [0]
    cnt_fn(c)
    return c[0]


def check(name, rows):
    """rows: list of (n, counted, formula). Prints a table and asserts equality."""
    print(f"\n{name}")
    print(f"{'n':>8} {'counted':>14} {'formula':>14}  ok")
    for n, got, want in rows:
        ok = got == want
        print(f"{n:>8} {got:>14} {want:>14}  {'yes' if ok else 'NO'}")
        assert ok, f"{name}: n={n} counted {got} but formula gives {want}"


def main():
    random.seed(1)
    N = [1, 2, 3, 5, 8, 10, 16, 31, 64, 100]
    N2 = [n for n in N if n >= 2]
    rnd = lambda n: random.sample(range(10 * n + 10), n)   # distinct values

    print("=" * 60, "\nMODULE 1 — worked examples")
    check("MaxElement: C(n) = n-1", [(n, max_element(rnd(n)), n - 1) for n in N])
    check("UniqueElements worst (all distinct): n(n-1)/2",
          [(n, unique_elements(rnd(n)), n * (n - 1) // 2) for n in N2])
    check("UniqueElements best (A[0] = A[1]): 1",
          [(n, unique_elements([7, 7] + rnd(n - 2)), 1) for n in N2])
    check("Matrix multiplication: n^3", [(n, matrix_multiplication(n), n ** 3) for n in [1, 2, 5, 10, 20]])
    check("Dependent bound loop: n(n+1)/2", [(n, dependent_bound_loop(n), n * (n + 1) // 2) for n in N])
    check("Multiplicative loop: floor(log2 n)+1",
          [(n, multiplicative_loop(n), floor_log(n, 2) + 1) for n in N + [1000, 1024, 1025]])

    print("\nSequential search, average case (exact fractions)")
    for n, p in [(10, 1), (10, 0), (10, "1/2"), (9, "1/3"), (100, "3/4")]:
        got = seq_search_avg_exact(n, p)
        pp = Fraction(p)
        want = pp * (n + 1) / 2 + n * (1 - pp)
        print(f"  n={n:>3} p={str(pp):>4}: {got} = {want}")
        assert got == want
    # Problem C1 (p = 1/3): (5n+1)/6
    for n in [6, 9, 12, 60]:
        assert seq_search_avg_exact(n, Fraction(1, 3)) == Fraction(5 * n + 1, 6)
    # Monte Carlo sanity check for p = 1/2, n = 20  -> (3n+1)/4 = 15.25
    n, trials, tot = 20, 200_000, 0
    for _ in range(trials):
        tot += random.randint(1, n) if random.random() < 0.5 else n
    print(f"  Monte Carlo n=20, p=1/2: {tot / trials:.3f}  (formula 15.25)")

    print("=" * 60, "\nMODULE 1 — original worked examples")
    check("Selection sort: n(n-1)/2", [(n, selection_sort(rnd(n)), n * (n - 1) // 2) for n in N])
    rows_naive, rows_horner = [], []
    for deg in [0, 1, 2, 5, 10, 20]:
        coef = [random.randint(-5, 5) for _ in range(deg + 1)]
        v1, m1 = poly_naive(coef, 3)
        v2, m2 = poly_horner(coef, 3)
        assert v1 == v2
        rows_naive.append((deg, m1, (deg + 1) * (deg + 2) // 2))
        rows_horner.append((deg, m2, deg))
    check("Naive polynomial evaluation (n = degree): (n+1)(n+2)/2", rows_naive)
    check("Horner's rule: n", rows_horner)

    print("=" * 60, "\nMODULE 1 — problems")
    check("A1 SumSquares: n", [(n, a1_sum_squares(rnd(n)), n) for n in N])
    for n in [2, 5, 10]:
        assert sum(1 for _ in range(3, n + 2)) == n - 1                 # A2 (a)
        assert sum(2 * i + 3 for i in range(1, n + 1)) == n * n + 4 * n  # A2 (b)
        assert sum(3 ** i for i in range(n)) == (3 ** n - 1) // 2        # A4 (b)
    check("A3 CountDescents: n-1", [(n, a3_count_descents(rnd(n)), n - 1) for n in N])
    check("B1 triple loop: n(n+1)(n+2)/6", [(n, b1_triple_loop(n), n * (n + 1) * (n + 2) // 6) for n in N])
    check("B2 j from i to n: n(n+1)/2", [(n, b2_upper_triangle(n), n * (n + 1) // 2) for n in N])
    check("B3 IsSorted worst (sorted): n-1", [(n, b3_is_sorted(list(range(n))), n - 1) for n in N2])
    check("B3 IsSorted best (A[0] > A[1]): 1", [(n, b3_is_sorted([9, 1] + list(range(n - 2))), 1) for n in N2])
    check("B4 double sum: (n-1)n(n+1)/2", [(n, b4_double_sum(n), (n - 1) * n * (n + 1) // 2) for n in N])
    check("C2(a) base-3 loop: floor(log3 n)+1",
          [(n, c2a_base3_loop(n), floor_log(n, 3) + 1) for n in [1, 2, 3, 8, 9, 26, 27, 81, 1000]])
    check("C2(b) nested log loop: n(floor(log2 n)+1)",
          [(n, c2b_nested_log(n), n * (floor_log(n, 2) + 1)) for n in N])
    # Find-the-mistake M1: the wrong answer n^2 differs from the true count
    assert dependent_bound_loop(10) == 55 != 100

    print("=" * 60, "\nMODULE 2 — worked examples")
    check("Factorial: M(n) = n", [(n, run(lambda c: factorial(n, c)), n) for n in [0] + N])
    check("Tower of Hanoi: 2^n - 1",
          [(n, run(lambda c: hanoi(n, 'A', 'C', 'B', c)), 2 ** n - 1) for n in [1, 2, 3, 4, 5, 10, 15]])
    check("BinRec, n = 2^k: log2 n", [(2 ** k, run(lambda c: bin_rec(2 ** k, c)), k) for k in range(0, 12)])
    check("BinRec, any n: floor(log2 n)", [(n, run(lambda c: bin_rec(n, c)), floor_log(n, 2)) for n in N + [1000]])
    check("Naive Fibonacci additions: F(n+1) - 1",
          [(n, run(lambda c: fib_naive(n, c)), F(n + 1) - 1) for n in [0, 1, 2, 3, 5, 10, 15, 20, 25]])
    check("Memoized Fibonacci additions: n - 1", [(n, fib_memo(n), n - 1) for n in [2, 3, 5, 10, 50, 500]])
    check("Iterative Fibonacci additions: n - 1", [(n, fib_iter(n), n - 1) for n in [2, 3, 5, 10, 50, 500]])

    print("=" * 60, "\nMODULE 2 — original worked examples")
    check("Recursive maximum: n-1", [(n, run(lambda c: rec_max(rnd(n), n, c)), n - 1) for n in N])
    rows = []
    for k in range(0, 11):
        c = [0]
        assert fast_power(3, 2 ** k, c) == 3 ** (2 ** k)
        rows.append((2 ** k, c[0], k))
    check("Fast exponentiation, n = 2^k: log2 n", rows)

    print("=" * 60, "\nMODULE 2 — problems")
    for n in range(0, 30):
        assert solve_rec(lambda k, x: x + 3, 0, 0, n) == 3 * n                           # A1
        assert solve_rec(lambda k, x: x + k, 0, 0, n) == n * (n + 1) // 2                # A3
        assert solve_rec(lambda k, x: x + 2 ** k, 1, 0, n) == 2 ** (n + 1) - 1           # B1
    for n in range(1, 30):
        assert solve_rec(lambda k, x: 2 * x, 3, 1, n) == 3 * 2 ** (n - 1)                # A4
    for k in range(0, 10):                                                               # B2
        x = 1
        for _ in range(k):
            x += 1
        assert x == k + 1                       # x(3^k) = k + 1 = log3 n + 1
    for k in range(0, 15):                                                               # C1
        x = 0
        for j in range(1, k + 1):
            x = 2 * x + 2 ** j
        assert x == k * 2 ** k                  # x(n) = n log2 n
    check("A2 recursive sum: n-1", [(n, run(lambda c: rec_sum(rnd(n), n, c)), n - 1) for n in N])
    rows = []
    for n in N:
        c = [0]
        assert b3_cube(n, c) == n ** 3
        rows.append((n, c[0], 3 * (n - 1)))
    check("B3 Cube(n): 3(n-1) multiplications, returns n^3", rows)
    check("B4 Draw(n) calls: (3^(n+1)-1)/2", [(n, run(lambda c: b4_draw(n, c)), (3 ** (n + 1) - 1) // 2) for n in range(0, 9)])
    rows = []
    for n in [1, 2, 3, 7, 8, 15, 16, 100, 1000, 1023, 1024]:
        c = [0]
        assert c2_power_general(2, n, c) == 2 ** n
        rows.append((n, c[0], floor_log(n, 2) + 1 + bin(n).count("1")))
    check("C2 fast power, any n: floor(log2 n) + 1 + popcount(n)", rows)
    # Find-the-mistake M1 (x(n) = x(n-1) + n): wrong n^2 vs correct n(n+1)/2
    assert solve_rec(lambda k, x: x + k, 0, 0, 10) == 55 != 100
    # Find-the-mistake M2 (BinRec with wrong A(1) = 1)
    assert run(lambda c: bin_rec(16, c)) == 4 != 5

    print("\nAll formulas confirmed.")

    if "--plot" in sys.argv:
        plot()


def plot():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    ns = list(range(2, 26))
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    ax[0].plot(ns, [b1_triple_loop(n) for n in ns], "o", label="counted (B1)")
    ax[0].plot(ns, [n * (n + 1) * (n + 2) / 6 for n in ns], "-", label="n(n+1)(n+2)/6")
    ax[0].set_title("Triple nested loop"); ax[0].set_xlabel("n"); ax[0].legend()
    ax[1].semilogy(ns, [run(lambda c: fib_naive(n, c)) for n in ns], "o", label="naive (counted)")
    ax[1].semilogy(ns, [F(n + 1) - 1 for n in ns], "-", label="F(n+1)-1")
    ax[1].semilogy(ns, [n - 1 for n in ns], "s", label="memo / iterative: n-1")
    ax[1].set_title("Fibonacci additions (log scale)"); ax[1].set_xlabel("n"); ax[1].legend()
    fig.tight_layout()
    fig.savefig("empirical_charts.png", dpi=130)
    print("Saved empirical_charts.png")


if __name__ == "__main__":
    main()
