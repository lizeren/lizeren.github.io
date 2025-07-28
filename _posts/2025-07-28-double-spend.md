---
title: 'Bitcoin double spending'
date: 2025-07-28
permalink: /posts/2025/7/bitcoin-double-spending/
tags:
  - Articles
  - Bitcoin
---

# Bitcoin double spending
Here’s what I’ve learned about **double spending in Bitcoin**, particularly from the perspective of an **attacker** — what they expect to happen and how they might attempt to succeed.

---
## What does an attacker expect to happen when they try to double spend?
An attacker usually creates two conflicting transactions:

- **Tx1**: A transaction that pays a certain amount of Bitcoin to a **merchant**. This transaction is **broadcast to the network** so the merchant can see it and accept the payment.
- **Tx2**: A transaction that pays the **same Bitcoin back to the attacker**. This transaction is **not broadcasted**, but kept secret.

The attacker’s goal is to make the merchant believe the transaction is valid (Tx1), then replace it later with Tx2 using a longer chain.

If **Tx2 were broadcast to the network**, two scenarios could happen:

1. **Tx1’s chain becomes longer than Tx2’s chain**  
   - Honest miners confirm Tx1.  
   - The payment goes through to the merchant.  
   - The attacker fails to double-spend.

2. **Tx2’s chain becomes longer**  
   - Tx1 is **orphaned** (removed from the main chain).  
   - Tx2 becomes the valid transaction.  
   - The attacker keeps the coins and **double-spends successfully**.

**Note**: Merchants and honest nodes do not accept invalid or conflicting transactions. An attacker cannot "steal" from others — they can only try to reverse their **own previous transaction**.

---

## Building the Blockchain Privately

To carry out a successful double-spend, the attacker must **mine an alternate blockchain in secret** that includes Tx2 (the self-payment).

This is difficult because:

- The Bitcoin network is decentralized and competitive.  
- Honest miners are simultaneously building the public chain with Tx1.  
- Unless the attacker has a significant amount of hash power, their private chain will **lag behind**, and Tx1 will receive **6 confirmations** before the attacker catches up.

Once a transaction has 6 confirmations, it is considered extremely secure and unlikely to be reversed.

---

## 50% Computing Power

If the attacker controls **less than 50% of the total mining power** of the Bitcoin network, the probability of successfully executing a double-spend attack is **low and decreases exponentially** with each additional confirmation. However, as the attacker’s hash power approaches 50%, the odds of success increase significantly.

At **just under 50% hash power**:

- The attacker has a **meaningful but uncertain chance** of catching up to the honest chain.  
- The probability of success depends on both the attacker's hash rate and how many confirmations the merchant waits for.  
- With enough luck and time, a successful double spend is **possible but not guaranteed**.

At **exactly or more than 50% hash power**:

- The attacker will **eventually catch up** and **replace the public chain** with their own — success is **guaranteed**, given enough time. The proof can be found and deduced the orignal Bitcoin whitepaper.
- They can reliably reverse confirmed transactions and double-spend at will.

> **Bitcoin nodes always follow the chain with the most cumulative proof of work**, not the one with the most confirmations for a specific transaction.

So if:

- The public chain has 6 blocks (confirmations) on top of `Tx1`, and  
- The attacker privately mines a competing chain with `Tx2`,  
- Once the attacker’s chain is **equal to or longer than** the public chain and is **broadcast**,  
- The entire network will **switch to the attacker’s chain**, and `Tx1` will be **orphaned**.

The attacker **does not need to mine 6 blocks in a row** — they only need to **catch up** and **surpass the chain by one block** to win.

---

### In Summary

- **< 50% hash power** → The attacker cannot consistently outpace the honest network. Double spending is **unlikely** and becomes more difficult with more confirmations.  
- **≥ 50% hash power** → The attacker will **inevitably succeed** in overtaking the chain. Double spending becomes **guaranteed** over time.


---




## Example: Double Spend in Action

To illustrate how a double-spend attack can succeed, consider the following scenario involving two competing blockchains — one public and one private — and how the network ultimately chooses the chain with the **most cumulative proof of work**, not necessarily the one seen first or confirmed most often.

### Honest (Public) Chain

Let’s say the honest network mines the following chain and includes `Tx1` (a payment to the merchant) in the first block:

Block A1 (includes Tx1)
Block A2
Block A3
Block A4
Block A5
Block A6


- The merchant sees **6 confirmations** on `Tx1` (i.e., 6 blocks built on top of it).
- Believing the transaction is final, the merchant **delivers the product**.

### Attacker’s Private Chain

Meanwhile, the attacker has been secretly mining a competing chain that includes a conflicting transaction, `Tx2`, which pays the coins back to themselves:

Block B1 (includes Tx2)
Block B2
Block B3
Block B4
Block B5
Block B6


At this point:

- Both chains are **6 blocks long**.
- However, the attacker has **not yet broadcasted** their private chain.
- Since both chains have the **same number of blocks**, the one with **greater cumulative proof of work** will be considered valid by the network.

### Now the Attacker Mines One More Block:

Block B7


Now the attacker's chain is **longer and has more total proof of work** than the public chain.

### What Happens Next:

- The attacker **broadcasts** their full 7-block private chain.  
- All nodes validate the chain and recognize it has **more cumulative proof of work** than the current public chain.  
- As per Bitcoin consensus rules, nodes **switch to the attacker’s chain**.  
- The original chain with `Tx1` is **orphaned**.  
- The transaction `Tx2` becomes **the valid transaction**, as it is part of the longest, heaviest chain.
- The merchant acknowledged `Tx1` before and now are forced to acknowledge `Tx2` as the valid transaction.

> **Result**: The attacker successfully **double-spent** the coins — without needing to win 6 blocks in a row. They simply **caught up** and then **surpassed** the honest chain in cumulative work.

