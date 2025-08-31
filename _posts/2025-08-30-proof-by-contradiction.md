---
title: 'Proof by contradiction'
date: 2025-08-30
permalink: /posts/2025/8/proof-by-contradiction/
tags:
  - Articles
  - Discrete Math
  - Proofs
---
My explanation and thoughts on proof by contradiction.

## My approach to construct a proof by contradiction

The proof starts by introducing a fact or ground truth that should be true and cannot be assumed to be false. This fact could be a axiom, a theorem that we have already proven, or a statement that we know to be true. Then, we introduce a claim that we want to prove. Now we can start form the proof by contradiction. We assume the negation of the claim to be true. Based on this negation of the claim, we form our deduction, which should lead to the violation of the fact or ground truth. Therefore, the negation of the claim is false, and the claim is true.

## Example: The square root of 2 is an irrational number
Here's a classic mathematical example where a direct proof is very difficult, but a proof by contradiction is simple and elegant.

### Claim: The square root of 2 is an irrational number.

An **irrational number** is one that cannot be written as a simple fraction `a/b`, where `a` and `b` are integers. A **rational number** is one that can.

**Why is a direct proof hard?** A direct proof would require you to show that √2 fails to match the form `a/b` for *every possible combination of integers `a` and `b` in the universe*. Proving something for an infinite set of cases is often impossible.

---

### The Proof by Contradiction

Instead, we can easily prove it by assuming the opposite and showing that this assumption leads to a logical absurdity.

* **Fact:** Any rational fraction `a/b` can be simplified to its lowest terms, where `a` and `b` are **not both even**. (If they were, you could just divide both by 2 until one of them is odd).

* **Claim:** √2 is irrational.

***

1.  **Assume the Opposite:** Let's assume that **√2 is rational**.

2.  **Logical Deduction:** If √2 is rational, we can write it as a simplified fraction `a/b`, where `a` and `b` are not both even.
    > √2 = `a/b`

3.  Now, let's do some algebra. First, square both sides:
    > 2 = `a² / b²`

4.  Then, multiply both sides by `b²`:
    > `2b² = a²`

5.  This equation tells us that `a²` must be an **even** number, because it's equal to 2 times another number. If `a²` is even, then `a` itself must also be **even**. (Because an odd number squared is always odd).

6.  Since `a` is even, we can write it as `a = 2k` for some integer `k`. Let's substitute that back into our equation:
    > `2b² = (2k)²`
    > `2b² = 4k²`

7.  Now, divide both sides by 2:
    > `b² = 2k²`

8.  This new equation tells us that `b²` must also be an **even** number. And if `b²` is even, then `b` itself must also be **even**.

9.  **The Contradiction :** We have now proven that `a` is even and `b` is even. This directly contradicts our initial **Fact** that the fraction `a/b` was simplified so that `a` and `b` were **not both even**.

10. **Conclusion:** Our initial assumption—that √2 is rational—led to a logical impossibility. Therefore, the assumption must be false, and the original claim must be true: **√2 is irrational**.


## Example:Halting Problem

### Fact (F)
For any fixed program **P** and input **x**, exactly one of the following is true:  

- **P(x)** halts, or  
- **P(x)** runs forever.  

---

### Claim (C)
There is no total program **H(P, x)** that always decides the halting problem, i.e., returns:

- **YES** iff **P(x)** halts, and  
- **NO** iff **P(x)** does not halt.  

---

### Negation Assumption
Assume the opposite:  
There exists an algorithm **HALT(P, x)** that always correctly decides whether **P(x)** halts.  

That is:  
- If **P(x)** halts, then **HALT(P, x) = true**  
- If **P(x)** runs forever, then **HALT(P, x) = false**  

---

### Deduction from the Negation
Using **HALT**, define a new program **D**:

```c
D(P):
    if HALT(P, P) == true: # if P halts on its own description
        loop forever
    else:
        halt immediately
```

So by construction:  
- If **P(P)** halts, then **D(P)** loops forever.  
- If **P(P)** loops forever, then **D(P)** halts.  

---

### Now Consider D(D)
#### Contradiction (Deduction Does Not Follow Fact Claim)

- If **HALT(D, D) = true**, then **D(D)** should halt.  
  But by **if** part of **D**, it will loop forever.  

- If **HALT(D, D) = false**, then **D(D)** should loop forever.  
  But by **else** part of **D**, it will halt.  

So in either case, the deduction from our assumption leads to a situation where the supposed **HALT** output does not match the actual behavior of **D(D)**.

This means our deduction from the negation does **not** follow the fact claim.  
Therefore, **no such total program HALT can exist**.

## Truth Table of Proof by Contradiction

Let P represent the claim and ¬P the negation of the claim. Also let C be the fact.  

Directly proving P can be difficult. However, notice that the truth column of P is the same as the truth column of (¬P) ⇒ (C ∧ ¬C). This means that instead of proving P directly, we can prove the implication (¬P) ⇒ (C ∧ ¬C). In other words, we try to show that assuming the negation of the claim leads to a contradiction.

Here’s how it works:  
- (C ∧ ¬C) is always false, since it is a contradiction.  
- An implication is true unless its antecedent is true while its consequent is false.  
- Because the consequent (C ∧ ¬C) is always false, the only way for the implication (¬P) ⇒ (C ∧ ¬C) to be true is if the antecedent (¬P) is false.  

So, when we successfully derive a contradiction from assuming ¬P, we establish that the implication is true. And since the implication can only be true when ¬P is false, it shows the impossbility of negating the claim while still obeying the fact(¬P is true), and indirectly proves P to be true.

| P | C | ¬P | C ∧ ¬C | (¬P) ⇒ (C ∧ ¬C) |
|---|---|----|--------|-----------------|
| T | T | F  | F      | T               |
| T | F | F  | F      | T               |
| F | T | T  | F      | F               |
| F | F | T  | F      | F               |

The Truth table of implication is:

| P | Q | P ⇒ Q |
|---|---|-------|
| T | T | T     |
| T | F | F     |
| F | T | T     |
| F | F | T     |

The value of (P ⇒ Q) is always true if Q is true.