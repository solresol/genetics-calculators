# Script.js Documentation

## Overview

`script.js` is the main frontend JavaScript file for an interactive genetics calculator application. It provides a canvas-based interface for creating and analyzing family pedigrees (family trees) to calculate probabilities of hereditary genetic conditions. The application uses Mendelian inheritance patterns, population genetics data, and optimization algorithms to help genetic counselors learn probability calculations.

## Architecture

The file consists of three main components:

1. **PedigreeChart** - Interactive canvas UI for building and visualizing pedigrees
2. **Optimizer** - Wrapper for simulated annealing optimization
3. **Population Genetics** - Carrier frequency data and utility functions

---

## Classes

### Individual (Lines 6-20)

Extends `BaseIndividual` from `src/individual.js` to add canvas positioning.

**Properties:**
- `x`, `y` - Canvas coordinates for rendering

**Methods:**
- `constructor(x, y, gender, id)` - Creates individual with position
- `setRace(race)` - Updates race/population and refreshes probabilities for current condition
- `updateFromPopulationFrequency()` - Recalculates probabilities based on population carrier frequencies

### PedigreeChart (Lines 25-1025)

Main interactive canvas class for pedigree creation and visualization.

**Properties:**
- `canvas`, `ctx` - Canvas element and 2D context
- `individuals` - Array of Individual objects
- `relations` - Array of relationships (parent/child, partnerships)
- `nextId` - Counter for assigning unique IDs
- `mode` - Current editing mode ('select', 'addMale', 'addFemale', 'addRelation', 'addChild', 'delete')
- `selectedIndividual` - Currently selected individual
- `pendingRelation` - First individual selected when creating relationships
- `needsRaceInput` - Set of individuals missing race/population data
- `isDragging`, `dragTarget`, `dragOffset` - Drag-and-drop state

#### Event Handling Methods

**`setupEventListeners()` (47-69)** - Attaches all DOM event handlers for canvas and buttons

**`handleClick(e)` (262-311)** - Main click handler that routes to appropriate action based on current mode:
- `addMale`/`addFemale` - Creates new individual at click position
- `delete` - Removes clicked individual
- `addRelation` - Two-step process to create relationships
- `addChild` - Two-step process to create child of two parents
- `select` - Selects individual for editing

**`handleMouseDown(e)` (209-226)** - Initiates drag operation in select mode

**`handleMouseMove(e)` (231-246)** - Updates position while dragging, keeps within canvas bounds

**`handleMouseUp(e)` (251-257)** - Completes drag operation

**`handleRightClick(e)` (134-150)** - Right-click toggles affected/unaffected status

**`handleKeyPress(e)` (74-80)** - Delete/Backspace keys delete selected individual

#### Mode Management

**`setMode(mode)` (156-186)** - Changes editing mode, updates UI button states and cursor

**`updateModeInstructions()` (191-204)** - Updates status message with mode instructions

#### Individual and Relationship Management

**`deleteIndividual(individual)` (86-129)** - Removes individual and all connected relationships after confirmation

**`addParentChild(parent, child)` (465-494)** - Creates parent-child relationship with validation:
- Prevents self-parentage
- Limits children to 2 parents
- Auto-creates partnership when child has 2 parents

**`addPartnership(ind1, ind2)` (501-516)** - Creates partnership between two individuals, clearing any existing partnerships

**`addChild(parent1, parent2)` (402-442)** - Creates new child for two parents:
- Ensures parents are partnered
- Prompts for gender (M/F) with validation
- Asks if child is hypothetical (unborn/potential)
- Positions child below parents
- Calculates probabilities from parents using Mendelian inheritance

**`findIndividualAt(x, y)` (450-458)** - Returns individual at canvas coordinates (30px radius)

**`checkNeedsRace(individual)` (522-526)** - Tracks individuals needing race/population input (founders without race data)

**`freezeUninformativeFounders()` (528-546)** - Marks founders as frozen if they have no descendants contributing to likelihood calculations

#### Probability Calculations

**`updateAllProbabilities()` (551-600)** - Recalculates genotype probabilities for all individuals:
1. Children calculate from parents
2. Founders refresh from population frequencies (if not manually modified)
3. **Special logic**: If child is affected, unaffected parents must be carriers (sets to [0, 0.5, 0.5, 0])
4. Recalculates children again after parent adjustments
5. Updates siblings of affected children

**`checkDataCompleteness()` (602-622)** - Validates pedigree completeness:
- Checks for children with only 1 parent
- Checks for founders missing race data
- Disables optimization buttons if incomplete
- Updates error message display

**`calculateNegativeLogLikelihood()` (995-1024)** - Computes optimization objective:
- Sums log-probabilities of observed phenotypes (affected/unaffected)
- **Excludes hypothetical individuals** from calculation
- Returns negative log-likelihood (lower is better)

**`getChildNegLogLikelihood(child)` (979-989)** - Calculates individual child's contribution to likelihood

#### Serialization

**`clear()` (627-638)** - Resets chart to empty state

**`loadFromObject(obj)` (644-700)** - Loads pedigree from JSON object:
- Sets genetic condition
- Creates individuals with positions
- Creates parent-child and partnership relationships
- Auto-layouts if coordinates missing
- Updates probabilities and validates

**`toObject(includeCoords)` (707-742)** - Exports pedigree to JSON format compatible with CLI:
- Includes individual data (id, gender, parents, affected status, race, hypothetical)
- Optionally includes canvas coordinates
- Exports partnership data
- Includes selected genetic condition

#### UI Updates

**`updateIndividualInfo()` (747-818)** - Updates info panel with selected individual details:
- Shows ID, gender, affected status
- Race/population selector
- Genotype probabilities (as fractions and decimals)
- Parent/children/partner relationships
- Right-click tip for toggling affected status

**`showStatus(message)` (317-323)** - Displays status messages to user

**`showRelationshipDialog(ind1, ind2)` (330-395)** - Shows modal dialog for choosing relationship type:
- Parent-child (both directions)
- Partnership
- Cancel option

#### Rendering

**`draw()` (823-894)** - Main rendering method:
1. Clears canvas
2. Draws partnership lines (double lines between partners)
3. Draws parent-child lines:
   - Color-coded by likelihood contribution (green = good fit, purple = poor fit)
   - Line thickness indicates fit quality
   - Displays negative log-likelihood value on line
4. Draws individual nodes
5. Highlights pending relation selection

**`drawIndividual(individual)` (900-977)** - Renders single individual:
- **Shape**: Square for males, circle for females
- **Fill color**: Red if affected, white if unaffected, light red if missing race data
- **Border**: Green if selected, blue dashed if hypothetical, red if missing race
- **Labels**:
  - "A" inside shape if affected
  - ID number below
  - Genotype probabilities as fractions (non-carrier, carrier, affected)
  - Raw probability values

### Optimizer (Lines 1211-1326)

Wrapper class for the optimization engine that finds maximum likelihood genotype probabilities.

**Properties:**
- `chart` - Reference to PedigreeChart
- `base` - BaseOptimizer instance from `src/optimizer.js`
- `running` - Whether continuous optimization is active
- `timeoutId` - Timer for continuous stepping
- `probabilityDelta` - Total probability change in last step

**Methods:**

**`start()` (1220-1233)** - Begins continuous optimization:
- Freezes uninformative founders
- Initializes optimizer state
- Disables start/step buttons, enables stop button
- Begins stepping loop

**`stepOnce()` (1235-1246)** - Performs single optimization step (when not running)

**`stepNode(individual)` (1248-1263)** - Optimizes probabilities for a specific individual only

**`stop()` (1265-1275)** - Halts continuous optimization

**`performSingleStep(update)` (1277-1292)** - Executes one optimization iteration:
- Delegates to `base.performSingleStep()`
- Updates display and redraws if requested
- Stops if converged

**`step()` (1294-1304)** - Continuous stepping loop:
- Performs optimization step
- Updates display every 100 iterations
- Schedules next step with 1ms timeout

**`reset()` (1306-1319)** - Restores all individuals to original probabilities

**`updateDisplay()` (1321-1325)** - Updates optimization stats in UI (iterations, likelihood, probability delta)

---

## Utility Functions

### Population Genetics

**`populationFrequencies` object (1028-1064)** - Carrier frequency data for 5 conditions across 5 populations:
- Conditions: CF, SMA, Tay-Sachs, PKU, Hemochromatosis
- Populations: European ancestry, African American, general, custom1, custom2

**`getCarrierFrequency(race)` (1071-1074)** - Returns carrier frequency for given race and current condition

**`updateFrequencyTable()` (1079-1116)** - Renders editable table of carrier frequencies:
- Creates input fields for each population
- Updates internal data structure on change
- Triggers probability recalculation

### Layout

**`autoLayout(chart, options)` (1122-1205)** - Automatically positions individuals in hierarchical layout:
1. Assigns generation levels (BFS from founders)
2. Calculates "depth" from bottom up (distance to leaf nodes)
3. Spaces individuals vertically by depth
4. Groups partner pairs horizontally
5. Spaces horizontally with xSpacing (default 120px)

---

## Initialization (Lines 1332-1392)

**`window.addEventListener('load', ...)` (1332-1392)** - Application bootstrap:

1. Creates `PedigreeChart` and `Optimizer` instances
2. Exposes to `window` for debugging
3. Sets up event listeners for:
   - Condition selector change → updates frequency table
   - Optimization buttons (start, step, step node, stop, reset)
   - File load button → triggers file input click
   - File input change → reads JSON and loads pedigree
   - Scenario selector population and load button
   - Save button → exports JSON and downloads file
4. Initializes frequency table

---

## Data Flow

1. **User creates pedigree** → Individuals and relations added to arrays
2. **Race/population set** → Triggers `updateAllProbabilities()`
3. **Probabilities calculated** → Mendelian inheritance from parents or population frequencies for founders
4. **Optimization runs** → Adjusts founder probabilities to maximize likelihood of observed phenotypes
5. **Canvas redraws** → Visual feedback shows probabilities and fit quality

---

## Key Features

- **Interactive drag-and-drop** positioning
- **Right-click shortcuts** for toggling affected status
- **Hypothetical children** excluded from likelihood (for "what if" scenarios)
- **Visual likelihood feedback** via colored parent-child lines
- **Probability display** as both fractions and decimals
- **JSON import/export** for saving/loading pedigrees
- **Predefined scenarios** for quick testing
- **Real-time optimization** with visual updates
- **Population-specific** carrier frequencies
- **Validation** ensures data completeness before optimization
