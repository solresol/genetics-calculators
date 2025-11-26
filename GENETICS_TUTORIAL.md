# Genetics Tutorial: Understanding Carrier Probabilities

This tutorial explains the biology, mathematics, and practical applications of carrier probability calculations for autosomal recessive genetic conditions.

## Table of Contents
- [Biology Basics](#biology-basics)
- [The 4-State Genotype Model](#the-4-state-genotype-model)
- [Mendelian Inheritance](#mendelian-inheritance)
- [Population Genetics](#population-genetics)
- [Worked Examples](#worked-examples)
- [Understanding the Optimization](#understanding-the-optimization)

---

## Biology Basics

### What is an Autosomal Recessive Condition?

Humans have 23 pairs of chromosomes. For most genes, we inherit two copies: one from each parent. In **autosomal recessive** conditions:

- **Normal allele (−)**: The "healthy" version of the gene
- **Disease allele (+)**: The mutated version that can cause disease

An individual's **genotype** (genetic makeup) can be:
- **−/−** (negative/negative): Two normal copies - **unaffected**
- **−/+** or **+/−** (carrier): One normal, one disease copy - **unaffected** but can pass disease to children
- **+/+** (positive/positive): Two disease copies - **affected** with the condition

### Why Do Carriers Matter?

Carriers are healthy but critical for genetic counseling:
1. **Reproductive risk**: Two carrier parents have a 25% chance per pregnancy of an affected child
2. **Family planning**: Knowing carrier status helps families make informed decisions
3. **Population screening**: Some populations have higher carrier rates for specific conditions

---

## The 4-State Genotype Model

This application uses a **4-state probability vector** for each individual:

```
[P(−/−), P(−/+), P(+/−), P(−/+)]
```

### Why Four States Instead of Three?

Although **−/+** and **+/−** are biologically identical (both are carriers), we track them separately because:
1. **Parent tracking**: Helps determine which allele came from which parent
2. **Mathematical consistency**: Simplifies Mendelian probability calculations
3. **Symmetry**: The middle two probabilities should be equal for founders

### Probability Constraints

For any individual, probabilities must:
- Be between 0 and 1
- Sum to exactly 1.0
- Satisfy: `P(−/+) = P(+/−)` for individuals without known parents (founders)

### Special Cases

**Affected individuals** (known to have disease):
```
[0.0, 0.0, 0.0, 1.0]  ← Fixed at +/+ with 100% certainty
```

**Typical founder** (no family history, general population):
```
[0.975, 0.0125, 0.0125, 0.00000625]  ← Based on carrier frequency ~0.025
```
The tiny P(+/+) reflects the very low chance two random people are both carriers.

---

## Mendelian Inheritance

### Punnett Square Review

When two parents have children, each parent passes one allele. For **two carrier parents** (−/+ × −/+):

```
        Parent 1
          −    +
       ┌─────┬─────┐
    −  │ −/− │ −/+ │  25% normal
P2  ├─────┼─────┤  50% carrier
    +  │ −/+ │ +/+ │  25% affected
       └─────┴─────┘
```

### Probability Calculation

For a child with parents P₁ and P₂, each of the child's 4 genotype probabilities comes from summing compatible parental combinations:

**Child's P(−/−)** = Ways to get − from both parents:
```
P₁(−/−) × P₂(−/−) × 1.0        ← Both parents pass −
+ P₁(−/−) × P₂(−/+) × 0.5      ← P1 passes −, P2 has 50% chance of −
+ P₁(−/−) × P₂(+/−) × 0.5
+ P₁(−/+) × P₂(−/−) × 0.5
+ P₁(+/−) × P₂(−/−) × 0.5
+ P₁(−/+) × P₂(−/+) × 0.25     ← Both carriers, 25% chance both pass −
+ ... (8 more terms)
```

The application implements this in `src/individual.js:updateProbabilitiesFromParents()`.

---

## Population Genetics

### Hardy-Weinberg Equilibrium

In a large, randomly mating population, allele frequencies remain constant. If the disease allele frequency is **q**, then:

- **Carrier frequency** = 2q(1−q) ≈ 2q (when q is small)
- **Affected frequency** = q²

### Condition-Specific Carrier Frequencies

This application includes data for 5 conditions:

| Condition | General Pop | European | African American | Notes |
|-----------|------------|----------|------------------|-------|
| **Cystic Fibrosis (CF)** | 2.5% | 2.9% | 0.67% | Most common in European descent |
| **Spinal Muscular Atrophy (SMA)** | 1.8% | 1.7% | 1.9% | Similar across populations |
| **Tay-Sachs** | 0.2% | 0.34% | 0.13% | Higher in Ashkenazi Jewish (not separately listed) |
| **Phenylketonuria (PKU)** | 1.5% | 2.0% | 0.5% | Newborn screening standard |
| **Hemochromatosis** | 8.0% | 11.0% | 1.4% | Most common genetic condition in Europeans |

**Source**: Population frequency data in `src/population.js`

---

## Worked Examples

### Example 1: Simple Carrier Risk (PKU)

**Scenario**: Use "PKU - Simple Carrier Risk" from the examples.

**Family**: Two parents (general population) have one daughter affected with PKU.

#### Initial State (Before Optimization)

**Parents** (ID 1 and 2):
- Both founders with PKU carrier frequency = 1.5% in general population
- Initial probabilities based on population: ~[0.970, 0.015, 0.015, 0.000225]

**Affected daughter** (ID 3):
- Fixed at: [0.0, 0.0, 0.0, 1.0]

#### After Optimization

**Parents** (optimized):
- Both should be: [0.0, 0.5, 0.5, 0.0]
- **Interpretation**: 100% certain both are carriers

**Why?**
- An affected child (+/+) must receive one + allele from each parent
- Therefore, both parents must be at least carriers
- Since parents are unaffected (not +/+), they must be −/+ or +/−
- The optimizer finds this unique solution

**Likelihood Math**:
```
L(data | both parents are carriers) = P(affected child | both carriers)
                                     = 0.25
Negative Log-Likelihood = −log(0.25) = 1.386
```

This is the minimum possible NLL for this scenario.

---

### Example 2: Two Affected Siblings (SMA)

**Scenario**: Use "SMA - Two Affected Siblings" from the examples.

**Family**: Two parents with TWO affected children (IDs 3 and 4), plus one hypothetical child (ID 5).

#### Before Optimization

**Parents**:
- Population baseline: SMA carrier frequency = 1.8%
- ~[0.964, 0.018, 0.018, 0.000324]

#### After Optimization

**Parents**:
- [0.0, 0.5, 0.5, 0.0] — Must be carriers

**Hypothetical Child** (ID 5):
- ~[0.25, 0.25, 0.25, 0.25]

**Interpretation**:
- 25% chance of being affected (+/+)
- 50% chance of being a carrier (−/+ or +/−)
- 25% chance of being unaffected (−/−)

This matches the classic **Punnett square** for two carrier parents!

**Why are parents certain carriers?**
- Having ONE affected child makes parents very likely carriers
- Having TWO affected children makes it virtually certain (probability ≈ 1.0)

---

### Example 3: Three Generations (PKU)

**Scenario**: Use "PKU - Three Generations" from the examples.

**Family Tree**:
```
      [1]──[2]    [3]──[4]       ← Grandparents
         │           │
         └──[5]───[6]─┘           ← Parents (5 married unrelated person 6)
               │
         ┌─────┼──────┐
        [8]   [9]    [10]         ← Children: 8 is affected
       (PKU)         (hypo)
```

#### Key Insights

**Individual 5** (daughter of grandparents 1 & 2):
- Parent of affected child, so MUST be a carrier
- This tells us that one of her parents (1 or 2) was a carrier

**Individual 6** (married into family):
- Also parent of affected child, MUST be a carrier
- Started with general population frequency (1.5%)

**Grandparents 1 & 2**:
- At least one MUST be a carrier (to pass to Individual 5)
- Optimizer will increase carrier probability for both
- Cannot determine which one without more affected descendants

**Individual 10** (hypothetical child of 5 & 6):
- Will show 25% chance of PKU
- This is the **recurrence risk** for the couple

---

### Example 4: Hypothetical Child with Affected Cousin

**Scenario**: Use "Hypothetical Child with Afflicted Cousin" from the examples.

**Family Tree**:
```
         [1]──[2]                 ← Original couple
            │
      ┌─────┴──────┐
     [3]──[5]    [4]──[7]         ← Two children with spouses
        │            │
       [6]          [8]            ← Grandchildren: 6 affected, 8 hypothetical
      (CF)         (hypo)
```

#### Question Being Asked

**"What is the risk for Individual 8 (hypothetical grandchild)?"**

This is a common genetic counseling scenario:
- One branch has an affected child (6)
- The other branch is planning a child (8)
- Are they at increased risk?

#### Analysis

**Individual 3** (parent of affected 6):
- MUST be a carrier

**Individual 4** (parent of hypothetical 8):
- SIBLING of Individual 3
- If parents (1 and 2) are both carriers:
  - 2/3 chance of being a carrier (not 1/2, because we know 4 is unaffected)
  - The "2/3" comes from the conditional probability given unaffected status

**Individual 8's risk**:
- Depends on:
  - Probability that 4 is a carrier (~2/3)
  - Probability that 7 (unrelated spouse) is a carrier (~2.9% for CF in European population)
- If both are carriers: 25% chance affected
- Combined risk ≈ 2/3 × 0.029 × 0.25 ≈ 0.48%

This is **higher than population risk** (0.000625) but still relatively low.

---

## Understanding the Optimization

### Why Do We Need Optimization?

When pedigrees get complex:
- Multiple generations
- Multiple affected individuals
- Intermarriage within families

The probabilities become **interdependent** and difficult to calculate directly. Optimization finds the most likely combination of genotypes.

### What is Negative Log-Likelihood?

**Likelihood** = Probability of observing the affected/unaffected pattern given the genotypes

**Log-Likelihood** = log(Likelihood) — easier to work with mathematically

**Negative Log-Likelihood (NLL)** = −log(Likelihood) — we minimize this

**Lower NLL = Better fit to data**

### Example Calculation

For "PKU - Simple Carrier Risk" (2 parents, 1 affected child):

**Before optimization** (parents at population frequency):
```
L = P(affected child | parents at pop frequency)
  ≈ 0.015 × 0.015 × 0.25        ← Both carriers × child affected
  = 0.00005625
NLL = −log(0.00005625) ≈ 9.79
```

**After optimization** (parents both carriers):
```
L = P(affected child | both parents carriers)
  = 1.0 × 1.0 × 0.25
  = 0.25
NLL = −log(0.25) ≈ 1.39
```

The optimizer **reduced NLL from 9.79 to 1.39**, finding the maximum likelihood explanation.

### Simulated Annealing

This application uses **simulated annealing**:
1. Randomly select a founder
2. Propose a small change to their probabilities
3. Recalculate all descendant probabilities
4. Accept the change if it improves NLL
5. Occasionally accept worse changes (to escape local minima)
6. Gradually reduce "temperature" to fine-tune the solution

This is more reliable than gradient descent for complex pedigrees.

---

## Practical Tips for Genetic Counselors

### 1. Always Specify Race/Population
Carrier frequencies vary significantly by ancestry. Missing race = incorrect baseline probabilities.

### 2. Use Hypothetical Children for Risk Assessment
Add a hypothetical child to any couple to see their reproductive risk instantly.

### 3. Run Optimization to Convergence
Click "Start" and wait for "no improvement" status. Partial optimization gives incorrect results.

### 4. Verify Affected Individuals are Fixed
Right-click to toggle affected status. Affected should show [0, 0, 0, 1] in the info panel.

### 5. Check Sibling Recurrence Risk
For two carrier parents with one affected child, the next child has 25% risk (not 33%). The optimizer will show this correctly for hypothetical siblings.

### 6. Save Complex Pedigrees
Use Save button to preserve your work, especially for multi-generation families.

### 7. Cross-Reference with Manual Calculations
For simple scenarios (e.g., two carriers), verify the optimizer gives the expected result before trusting it on complex cases.

---

## Additional Resources

- **ACMG Practice Guidelines**: Standards for genetic counseling
- **GeneReviews**: Detailed information on genetic conditions
- **Hardy-Weinberg Calculator**: For population genetics calculations
- **Punnett Square Generator**: For simple Mendelian inheritance

---

## Questions or Issues?

If you find discrepancies between the optimizer results and manual calculations, or have questions about the genetics:
1. Check that all affected individuals are marked correctly
2. Verify race/population for all founders
3. Ensure optimization ran to convergence
4. Review this tutorial for the biological assumptions

This tool is for **educational purposes** and learning probability calculations. Clinical genetic counseling should always be performed by certified professionals.
