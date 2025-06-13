        /**
         * Represents a person in the pedigree.
         */
        class Individual {
            /**
             * Create an individual.
             * @param {number} x - X coordinate on the canvas.
             * @param {number} y - Y coordinate on the canvas.
             * @param {'M'|'F'} gender - Gender of the individual.
             * @param {number} id - Unique identifier.
             */
            constructor(x, y, gender, id) {
                this.x = x;
                this.y = y;
                this.gender = gender; // 'M' or 'F'
                this.id = id;
                this.affected = false;
                this.race = null;
                this.parents = [];
                this.children = [];
                this.partner = null;
                this.hypothetical = false;
                
                // Genotype probabilities: [neg-neg, neg-pos, pos-neg, pos-pos]
                this.probabilities = [0.25, 0.25, 0.25, 0.25];
                this.originalProbabilities = [...this.probabilities];
                this.frozen = false;
                
                console.log(`Created individual ${id} with initial probabilities: [${this.probabilities.join(', ')}]`);
            }
            
            /**
             * Mark the individual as affected or unaffected.
             * @param {boolean} affected - Whether the individual is affected.
             */
            setAffected(affected) {
                this.affected = affected;
                if (affected) {
                    this.probabilities = [0.0, 0.0, 0.0, 1.0];
                    this.frozen = true;
                } else {
                    this.probabilities = [1.0, 0.0, 0.0, 0.0]; // Default unaffected
                    this.frozen = false;
                }
                
                // Validate and normalize
                this.validateAndNormalizeProbabilities();
                this.originalProbabilities = [...this.probabilities];
            }
            
            /**
             * Ensure probabilities are valid and sum to one.
             */
            validateAndNormalizeProbabilities() {
                // Check for invalid values
                for (let i = 0; i < this.probabilities.length; i++) {
                    if (isNaN(this.probabilities[i]) || this.probabilities[i] < 0) {
                        console.error(`Invalid probability ${this.probabilities[i]} at index ${i} for individual ${this.id}`);
                        this.probabilities[i] = 0;
                    }
                }
                
                // Normalize to sum to 1
                const sum = this.probabilities.reduce((a, b) => a + b, 0);
                if (sum > 0) {
                    this.probabilities = this.probabilities.map(p => p / sum);
                } else {
                    // All probabilities were 0 or invalid, set to default
                    this.probabilities = [0.25, 0.25, 0.25, 0.25];
                }
                
                console.log(`Individual ${this.id} probabilities normalized: [${this.probabilities.map(p => p.toFixed(4)).join(', ')}]`);
            }
            
            /**
             * Set the individual's race and update probabilities if needed.
             * @param {string} race - Population key used for frequencies.
             */
            setRace(race) {
                this.race = race;
                if (this.parents.length === 0 && !this.frozen) {
                    this.updateFromPopulationFrequency();
                }
            }
            
            /**
             * Initialize founder probabilities from population frequencies.
             */
            updateFromPopulationFrequency() {
                if (!this.race || this.frozen) return;
                
                const frequency = getCarrierFrequency(this.race);
                if (frequency !== null) {
                    console.log(`Updating individual ${this.id} with population frequency ${frequency} for race ${this.race}`);
                    
                    // For founders, use Hardy-Weinberg equilibrium
                    const q = frequency; // carrier frequency
                    const p = 1 - q;
                    
                    if (!this.affected) {
                        this.probabilities = [
                            p * p,     // neg-neg
                            p * q,     // neg-pos
                            q * p,     // pos-neg
                            q * q      // pos-pos
                        ];
                    }
                    
                    this.validateAndNormalizeProbabilities();
                    this.originalProbabilities = [...this.probabilities];
                }
            }
            
            /**
             * Update genotype probabilities based on parents.
             */
            calculateFromParents() {
                if (this.parents.length !== 2 || this.frozen) return;
                
                const [parent1, parent2] = this.parents;
                const newProbs = [0, 0, 0, 0];
                
                console.log(`Calculating probabilities for individual ${this.id} from parents ${parent1.id} and ${parent2.id}`);
                console.log(`Parent ${parent1.id} probabilities: [${parent1.probabilities.map(p => p.toFixed(3)).join(', ')}]`);
                console.log(`Parent ${parent2.id} probabilities: [${parent2.probabilities.map(p => p.toFixed(3)).join(', ')}]`);
                
                // Calculate offspring probabilities from parental genotypes
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        const p1Prob = parent1.probabilities[i];
                        const p2Prob = parent2.probabilities[j];
                        
                        if (p1Prob > 0 && p2Prob > 0) {
                            // Convert index to genotype
                            const p1Geno = indexToGenotype(i);
                            const p2Geno = indexToGenotype(j);
                            
                            console.log(`  Parent combination: ${parent1.id}[${i}]=${p1Prob.toFixed(3)} × ${parent2.id}[${j}]=${p2Prob.toFixed(3)}`);
                            console.log(`    Genotypes: [${p1Geno}] × [${p2Geno}]`);
                            
                            // Calculate offspring genotype probabilities
                            const offspringProbs = calculateOffspringProbabilities(p1Geno, p2Geno);
                            
                            for (let k = 0; k < 4; k++) {
                                const contribution = p1Prob * p2Prob * offspringProbs[k];
                                newProbs[k] += contribution;
                                if (contribution > 0) {
                                    console.log(`    Contribution to offspring[${k}]: ${contribution.toFixed(4)}`);
                                }
                            }
                        }
                    }
                }
                
                // Validate probabilities
                const sum = newProbs.reduce((a, b) => a + b, 0);
                console.log(`Individual ${this.id} calculated probabilities: [${newProbs.map(p => p.toFixed(3)).join(', ')}], sum: ${sum.toFixed(3)}`);
                
                if (Math.abs(sum - 1.0) > 0.001) {
                    console.error(`ERROR: Probabilities don't sum to 1.0 for individual ${this.id}! Sum = ${sum}`);
                }
                
                for (let prob of newProbs) {
                    if (prob < 0 || prob > 1) {
                        console.error(`ERROR: Invalid probability ${prob} for individual ${this.id}!`);
                    }
                }
                
                this.probabilities = newProbs;
                this.validateAndNormalizeProbabilities();
            }
        }
        
        /**
         * Convert probability array index to genotype.
         * @param {number} index
         * @returns {string[]}
         */
        function indexToGenotype(index) {
            const genotypes = [
                ['neg', 'neg'],
                ['neg', 'pos'],
                ['pos', 'neg'],
                ['pos', 'pos']
            ];
            return genotypes[index];
        }
        
        /**
         * Calculate offspring genotype probabilities from parental genotypes.
         * @param {string[]} parent1Geno
         * @param {string[]} parent2Geno
         * @returns {number[]}
         */
        function calculateOffspringProbabilities(parent1Geno, parent2Geno) {
            const probs = [0, 0, 0, 0]; // [neg-neg, neg-pos, pos-neg, pos-pos]
            
            console.log(`Calculating offspring from parent1: [${parent1Geno}] and parent2: [${parent2Geno}]`);
            
            // Each parent contributes one allele - simple Mendelian genetics
            for (let allele1 of parent1Geno) {
                for (let allele2 of parent2Geno) {
                    // Offspring gets allele1 from parent1 and allele2 from parent2
                    let index;
                    
                    if (allele1 === 'neg' && allele2 === 'neg') index = 0;      // neg-neg
                    else if (allele1 === 'neg' && allele2 === 'pos') index = 1; // neg-pos  
                    else if (allele1 === 'pos' && allele2 === 'neg') index = 2; // pos-neg
                    else if (allele1 === 'pos' && allele2 === 'pos') index = 3; // pos-pos
                    
                    // Each combination has probability = 1/(2*2) = 0.25
                    probs[index] += 0.25;
                    
                    console.log(`  ${allele1}-${allele2} -> index ${index}, running total: ${probs[index]}`);
                }
            }
            
            console.log(`Final offspring probabilities: [${probs.map(p => p.toFixed(3)).join(', ')}]`);
            return probs;
        }
        
        /**
         * Interactive canvas used to build pedigrees.
         */
        class PedigreeChart {
            /**
             * @param {HTMLCanvasElement} canvas - Canvas element for drawing.
             */
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.individuals = [];
                this.relations = [];
                this.nextId = 1;
                this.mode = 'select';
                this.selectedIndividual = null;
                this.pendingRelation = null;
                this.needsRaceInput = new Set();
                
                this.setupEventListeners();
                this.draw();
            }
            
            /**
             * Attach DOM event handlers for user interaction.
             */
            setupEventListeners() {
                this.canvas.addEventListener('click', (e) => this.handleClick(e));
                this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
                this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                
                // Add keyboard listener for delete
                document.addEventListener('keydown', (e) => this.handleKeyPress(e));
                
                document.getElementById('addMaleBtn').addEventListener('click', () => this.setMode('addMale'));
                document.getElementById('addFemaleBtn').addEventListener('click', () => this.setMode('addFemale'));
                document.getElementById('addRelationBtn').addEventListener('click', () => this.setMode('addRelation'));
                document.getElementById('selectBtn').addEventListener('click', () => this.setMode('select'));
                document.getElementById('clearBtn').addEventListener('click', () => this.clear());
                document.getElementById('addChildBtn').addEventListener('click', () => this.setMode('addChild'));
                document.getElementById('deleteBtn').addEventListener('click', () => this.setMode('delete'));
                
                // Add dragging state
                this.isDragging = false;
                this.dragTarget = null;
                this.dragOffset = {x: 0, y: 0};
            }
            
            /**
             * Handle delete/backspace keyboard events.
             */
            handleKeyPress(e) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (this.selectedIndividual) {
                        this.deleteIndividual(this.selectedIndividual);
                    }
                }
            }
            
            /**
             * Remove an individual and related connections.
             * @param {Individual} individual
             */
            deleteIndividual(individual) {
                if (!confirm(`Delete individual ${individual.id}?`)) {
                    return;
                }
                
                // Remove all relations involving this individual
                this.relations = this.relations.filter(rel => {
                    if (rel.type === 'parent') {
                        return rel.parent !== individual && rel.child !== individual;
                    } else if (rel.type === 'partner') {
                        return !rel.individuals.includes(individual);
                    }
                    return true;
                });
                
                // Remove from parents' children lists
                for (let parent of individual.parents) {
                    parent.children = parent.children.filter(child => child !== individual);
                }
                
                // Remove from children's parents lists
                for (let child of individual.children) {
                    child.parents = child.parents.filter(parent => parent !== individual);
                }
                
                // Remove partner relationship
                if (individual.partner) {
                    individual.partner.partner = null;
                }
                
                // Remove from individuals list
                this.individuals = this.individuals.filter(ind => ind !== individual);
                
                // Clear selection if this was selected
                if (this.selectedIndividual === individual) {
                    this.selectedIndividual = null;
                }
                
                this.needsRaceInput.delete(individual);
                this.updateAllProbabilities();
                this.draw();
                this.updateIndividualInfo();
                this.showStatus(`Deleted individual ${individual.id}`);
            }
            
            /**
             * Toggle affected status with the right mouse button.
             */
            handleRightClick(e) {
                e.preventDefault(); // Prevent context menu
                
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
                
                const clickedIndividual = this.findIndividualAt(x, y);
                if (clickedIndividual) {
                    // Toggle affected status
                    clickedIndividual.setAffected(!clickedIndividual.affected);
                    this.updateAllProbabilities();
                    this.draw();
                    this.updateIndividualInfo();
                    this.showStatus(`Individual ${clickedIndividual.id} is now ${clickedIndividual.affected ? 'AFFECTED' : 'unaffected'}`);
                }
            }
            
            /**
             * Change the active editing mode.
             * @param {string} mode
             */
            setMode(mode) {
                this.mode = mode;
                this.pendingRelation = null;
                this.isDragging = false;
                this.dragTarget = null;
                
                document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
                const activeBtn = {
                    'addMale': 'addMaleBtn',
                    'addFemale': 'addFemaleBtn',
                    'addRelation': 'addRelationBtn',
                    'addChild': 'addChildBtn',
                    'delete': 'deleteBtn',
                    'select': 'selectBtn'
                }[mode];
                document.getElementById(activeBtn).classList.add('active');
                
                // Update cursor and instructions
                if (mode === 'select') {
                    this.canvas.style.cursor = 'pointer';
                } else if (mode === 'delete') {
                    this.canvas.style.cursor = 'not-allowed';
                } else if (mode === 'addMale' || mode === 'addFemale') {
                    this.canvas.style.cursor = 'crosshair';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
                
                this.updateModeInstructions();
                this.draw();
            }
            
            /**
             * Placeholder for displaying mode instructions in the UI.
             */
            updateModeInstructions() {
                const instructions = {
                    'select': 'Click individuals to select/move them, or drag to move',
                    'addMale': 'Click empty space to add a male (square)',
                    'addFemale': 'Click empty space to add a female (circle)', 
                    'addRelation': 'Click two individuals to create parent-child or partnership',
                    'addChild': 'Click two individuals who will be parents of a new child'
                };
                
                // You could add this to the UI if you want instructions displayed
            }
            
            /**
             * Start dragging an individual when in select mode.
             */
            handleMouseDown(e) {
                if (this.mode !== 'select') return;
                
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
                
                const clickedIndividual = this.findIndividualAt(x, y);
                if (clickedIndividual) {
                    this.isDragging = true;
                    this.dragTarget = clickedIndividual;
                    this.dragOffset = {
                        x: x - clickedIndividual.x,
                        y: y - clickedIndividual.y
                    };
                    this.canvas.style.cursor = 'grabbing';
                }
            }
            
            /**
             * Update individual position while dragging.
             */
            handleMouseMove(e) {
                if (!this.isDragging || !this.dragTarget) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
                
                this.dragTarget.x = x - this.dragOffset.x;
                this.dragTarget.y = y - this.dragOffset.y;
                
                // Keep within canvas bounds
                this.dragTarget.x = Math.max(25, Math.min(this.canvas.width - 25, this.dragTarget.x));
                this.dragTarget.y = Math.max(25, Math.min(this.canvas.height - 25, this.dragTarget.y));
                
                this.draw();
            }
            
            /**
             * Finish dragging operation.
             */
            handleMouseUp(e) {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.dragTarget = null;
                    this.canvas.style.cursor = 'pointer';
                }
            }
            
            /**
             * Primary click handler responding to current mode.
             */
            handleClick(e) {
                // Don't handle clicks if we were dragging
                if (this.isDragging) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
                
                const clickedIndividual = this.findIndividualAt(x, y);
                
                if (this.mode === 'addMale' || this.mode === 'addFemale') {
                    if (!clickedIndividual) {
                        const gender = this.mode === 'addMale' ? 'M' : 'F';
                        const individual = new Individual(x, y, gender, this.nextId++);
                        this.individuals.push(individual);
                        this.checkNeedsRace(individual);
                        this.draw();
                    }
                } else if (this.mode === 'delete') {
                    if (clickedIndividual) {
                        this.deleteIndividual(clickedIndividual);
                    }
                } else if (this.mode === 'addRelation') {
                    if (clickedIndividual) {
                        if (!this.pendingRelation) {
                            this.pendingRelation = clickedIndividual;
                            this.showStatus(`Selected ${clickedIndividual.id}. Click another individual to create relationship.`);
                        } else if (this.pendingRelation !== clickedIndividual) {
                            this.showRelationshipDialog(this.pendingRelation, clickedIndividual);
                            this.pendingRelation = null;
                        }
                        this.draw();
                    }
                } else if (this.mode === 'addChild') {
                    if (clickedIndividual) {
                        if (!this.pendingRelation) {
                            this.pendingRelation = clickedIndividual;
                            this.showStatus(`Selected parent ${clickedIndividual.id}. Click the other parent.`);
                        } else if (this.pendingRelation !== clickedIndividual) {
                            this.addChild(this.pendingRelation, clickedIndividual);
                            this.pendingRelation = null;
                        }
                        this.draw();
                    }
                } else if (this.mode === 'select') {
                    this.selectedIndividual = clickedIndividual;
                    this.updateIndividualInfo();
                    this.draw();
                }
            }
            
            /**
             * Display a status message (console only for now).
             * @param {string} message
             */
            showStatus(message) {
                console.log(message);
            }
            
            /**
             * Display a dialog to choose a relationship between two individuals.
             * @param {Individual} ind1
             * @param {Individual} ind2
             */
            showRelationshipDialog(ind1, ind2) {
                // Create a simple dialog with buttons instead of prompt
                const relationDialog = document.createElement('div');
                relationDialog.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border: 2px solid #333;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    z-index: 1000;
                    font-family: Arial, sans-serif;
                `;
                
                relationDialog.innerHTML = `
                    <h3>Choose Relationship</h3>
                    <p>Individual ${ind1.id} and Individual ${ind2.id}</p>
                    <button id="rel-parent" style="display: block; margin: 5px 0; padding: 10px; width: 100%;">
                        ${ind1.id} is parent of ${ind2.id}
                    </button>
                    <button id="rel-child" style="display: block; margin: 5px 0; padding: 10px; width: 100%;">
                        ${ind1.id} is child of ${ind2.id}
                    </button>
                    <button id="rel-partner" style="display: block; margin: 5px 0; padding: 10px; width: 100%;">
                        ${ind1.id} and ${ind2.id} are partners
                    </button>
                    <button id="rel-cancel" style="display: block; margin: 10px 0 0 0; padding: 10px; width: 100%; background: #ccc;">
                        Cancel
                    </button>
                `;
                
                document.body.appendChild(relationDialog);
                
                // Add event listeners
                document.getElementById('rel-parent').onclick = () => {
                    this.addParentChild(ind1, ind2);
                    this.updateAllProbabilities();
                    this.draw(); // Force redraw
                    document.body.removeChild(relationDialog);
                    this.showStatus(`Added: ${ind1.id} is parent of ${ind2.id}`);
                };
                
                document.getElementById('rel-child').onclick = () => {
                    this.addParentChild(ind2, ind1);
                    this.updateAllProbabilities();
                    this.draw(); // Force redraw
                    document.body.removeChild(relationDialog);
                    this.showStatus(`Added: ${ind1.id} is child of ${ind2.id}`);
                };
                
                document.getElementById('rel-partner').onclick = () => {
                    this.addPartnership(ind1, ind2);
                    this.updateAllProbabilities();
                    this.draw(); // Force redraw
                    document.body.removeChild(relationDialog);
                    this.showStatus(`Added: ${ind1.id} and ${ind2.id} are partners`);
                };
                
                document.getElementById('rel-cancel').onclick = () => {
                    document.body.removeChild(relationDialog);
                    this.showStatus(`Cancelled relationship`);
                };
            }
            
            /**
             * Create a child for two parents.
             * @param {Individual} parent1
             * @param {Individual} parent2
             */
            addChild(parent1, parent2) {
                // First make sure they're partners
                if (parent1.partner !== parent2) {
                    this.addPartnership(parent1, parent2);
                }
                
                // Create child positioned below parents
                const x = (parent1.x + parent2.x) / 2;
                const y = Math.max(parent1.y, parent2.y) + 80;
                
                // Ask for gender with better validation
                let gender;
                while (true) {
                    const input = prompt("Child gender: M for male, F for female", "M");
                    if (input === null) return; // User cancelled
                    gender = input.toUpperCase().trim();
                    if (gender === 'M' || gender === 'F') break;
                    alert("Please enter 'M' for male or 'F' for female");
                }
                
                // Ask if this is a hypothetical child
                const isHypothetical = confirm("Is this a hypothetical child (unborn/potential)?\n\nClick OK for hypothetical, Cancel for real child");
                
                const child = new Individual(x, y, gender, this.nextId++);
                child.parents = [parent1, parent2];
                child.hypothetical = isHypothetical;
                
                parent1.children.push(child);
                parent2.children.push(child);
                
                this.individuals.push(child);
                this.relations.push({type: 'parent', parent: parent1, child: child});
                this.relations.push({type: 'parent', parent: parent2, child: child});
                
                child.calculateFromParents();
                this.draw();
                
                // Show status message
                const statusMsg = document.getElementById('statusMessage');
                statusMsg.textContent = `Added ${isHypothetical ? 'hypothetical ' : ''}child with probability calculations based on parents`;
            }
            
            /**
             * Locate an individual at canvas coordinates.
             * @param {number} x
             * @param {number} y
             * @returns {Individual|null}
             */
            findIndividualAt(x, y) {
                for (let individual of this.individuals) {
                    const distance = Math.sqrt((x - individual.x) ** 2 + (y - individual.y) ** 2);
                    if (distance <= 20) {
                        return individual;
                    }
                }
                return null;
            }
            
            /**
             * Link a parent and child together.
             * @param {Individual} parent
             * @param {Individual} child
             */
            addParentChild(parent, child) {
                if (!parent || !child) {
                    alert("Parent or child missing");
                    return;
                }
                if (parent === child) {
                    alert("An individual cannot be their own parent");
                    return;
                }
                if (child.parents.length >= 2 && !child.parents.includes(parent)) {
                    alert("Child already has two parents!");
                    return;
                }

                if (!child.parents.includes(parent)) {
                    child.parents.push(parent);
                }
                if (!parent.children.includes(child)) {
                    parent.children.push(child);
                }
                if (child.parents.length > 2) {
                    alert("Child cannot have more than two parents!");
                    return;
                }
                this.relations.push({type: 'parent', parent: parent, child: child});
            }
            
            /**
             * Create a partnership relation between two individuals.
             * @param {Individual} ind1
             * @param {Individual} ind2
             */
            addPartnership(ind1, ind2) {
                // Don't add if already partners
                if (ind1.partner === ind2) return;
                
                // Clear existing partnerships
                if (ind1.partner) {
                    ind1.partner.partner = null;
                }
                if (ind2.partner) {
                    ind2.partner.partner = null;
                }
                
                ind1.partner = ind2;
                ind2.partner = ind1;
                this.relations.push({type: 'partner', individuals: [ind1, ind2]});
            }
            
            /**
             * Track individuals missing race information.
             * @param {Individual} individual
             */
            checkNeedsRace(individual) {
                if (individual.parents.length === 0 && !individual.race) {
                    this.needsRaceInput.add(individual);
                }
            }
            
            /**
             * Recalculate probabilities for every individual.
             */
            updateAllProbabilities() {
                // Update probabilities for all individuals based on their parents
                for (let individual of this.individuals) {
                    if (individual.parents.length === 2) {
                        individual.calculateFromParents();
                    } else if (individual.parents.length === 0) {
                        individual.updateFromPopulationFrequency();
                    }
                }
            }
            
            /**
             * Remove all individuals and relations from the chart.
             */
            clear() {
                this.individuals = [];
                this.relations = [];
                this.selectedIndividual = null;
                this.pendingRelation = null;
                this.isDragging = false;
                this.dragTarget = null;
                this.needsRaceInput.clear();
                this.nextId = 1;
                this.draw();
                this.updateIndividualInfo();
            }

            /**
             * Load pedigree data from an object matching the CLI JSON format.
             * @param {Object} obj
             */
            loadFromObject(obj) {
                this.clear();

                // Set condition and update frequency table
                if (obj.condition) {
                    document.getElementById('conditionSelect').value = obj.condition;
                    updateFrequencyTable();
                }

                const map = new Map();
                let maxId = 0;

                // Create individuals
                for (const info of obj.individuals) {
                    const x = typeof info.x === 'number' ? info.x : 50;
                    const y = typeof info.y === 'number' ? info.y : 50;
                    const ind = new Individual(x, y, info.gender, info.id);
                    if (info.affected) ind.setAffected(true);
                    if (info.race) ind.setRace(info.race);
                    if (info.hypothetical) ind.hypothetical = true;
                    this.individuals.push(ind);
                    map.set(info.id, ind);
                    if (info.id > maxId) maxId = info.id;
                    this.checkNeedsRace(ind);
                }

                // Create relations
                for (const info of obj.individuals) {
                    const child = map.get(info.id);
                    if (!child || !info.parents) continue;
                    if (info.parents[0]) {
                        const p1 = map.get(info.parents[0]);
                        if (p1) this.addParentChild(p1, child);
                    }
                    if (info.parents[1]) {
                        const p2 = map.get(info.parents[1]);
                        if (p2) this.addParentChild(p2, child);
                    }
                    if (info.parents.length === 2) {
                        const p1 = map.get(info.parents[0]);
                        const p2 = map.get(info.parents[1]);
                        if (p1 && p2) this.addPartnership(p1, p2);
                    }
                }

                this.nextId = maxId + 1;

                autoLayout(this);
                this.updateAllProbabilities();
                this.draw();
                this.updateIndividualInfo();
            }
            
            /**
             * Refresh the info panel with details of the selected individual.
             */
            updateIndividualInfo() {
                const info = document.getElementById('individualInfo');
                if (this.selectedIndividual) {
                    const ind = this.selectedIndividual;
                    const probs = ind.probabilities.map(p => p.toFixed(3)).join(', ');
                    
                    info.innerHTML = `
                        <strong>Individual ${ind.id} (${ind.gender === 'M' ? 'Male' : 'Female'})</strong><br>
                        ${ind.hypothetical ? '<em style="color: #007bff;">Hypothetical</em><br>' : ''}
                        <div style="margin: 10px 0; padding: 10px; background: ${ind.affected ? '#ffebee' : '#e8f5e8'}; border-radius: 4px;">
                            <label style="font-size: 14px; font-weight: bold;">
                                <input type="checkbox" id="affectedCheck" ${ind.affected ? 'checked' : ''} style="margin-right: 8px;">
                                ${ind.affected ? '🔴 AFFECTED' : '🟢 Unaffected'}
                            </label>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                Right-click individual to toggle quickly
                            </div>
                        </div>
                        <label><strong>Race/Population:</strong></label>
                        <select id="raceSelect" style="width: 100%; margin-bottom: 10px;">
                            <option value="">Select race/population</option>
                            <option value="european_ancestry" ${ind.race === 'european_ancestry' ? 'selected' : ''}>European Ancestry</option>
                            <option value="african_american" ${ind.race === 'african_american' ? 'selected' : ''}>African American</option>
                            <option value="general" ${ind.race === 'general' ? 'selected' : ''}>General Population</option>
                            <option value="custom1" ${ind.race === 'custom1' ? 'selected' : ''}>Custom 1</option>
                            <option value="custom2" ${ind.race === 'custom2' ? 'selected' : ''}>Custom 2</option>
                        </select>
                        <div style="font-size: 12px;">
                            <strong>Genotype Probabilities:</strong><br>
                            <div style="font-family: monospace; background: #f8f9fa; padding: 5px; border-radius: 3px;">
                                neg-neg: ${ind.probabilities[0].toFixed(3)}<br>
                                neg-pos: ${ind.probabilities[1].toFixed(3)}<br>
                                pos-neg: ${ind.probabilities[2].toFixed(3)}<br>
                                pos-pos: ${ind.probabilities[3].toFixed(3)}
                            </div>
                        </div>
                        ${ind.parents.length > 0 ? `<div style="margin-top: 10px; font-size: 12px; color: #666;">Parents: ${ind.parents.map(p => p.id).join(', ')}</div>` : ''}
                        ${ind.children.length > 0 ? `<div style="font-size: 12px; color: #666;">Children: ${ind.children.map(c => c.id).join(', ')}</div>` : ''}
                        ${ind.partner ? `<div style="font-size: 12px; color: #666;">Partner: ${ind.partner.id}</div>` : ''}
                    `;
                    
                    document.getElementById('affectedCheck').addEventListener('change', (e) => {
                        ind.setAffected(e.target.checked);
                        this.updateAllProbabilities();
                        this.draw();
                        this.updateIndividualInfo();
                        this.showStatus(`Individual ${ind.id} is now ${ind.affected ? 'AFFECTED' : 'unaffected'}`);
                    });
                    
                    document.getElementById('raceSelect').addEventListener('change', (e) => {
                        ind.setRace(e.target.value);
                        this.needsRaceInput.delete(ind);
                        this.updateAllProbabilities();
                        this.draw();
                        this.updateIndividualInfo();
                        if (e.target.value) {
                            this.showStatus(`Set race for Individual ${ind.id}: ${e.target.value}`);
                        }
                    });
                } else {
                    info.innerHTML = `
                        <div style="text-align: center; color: #666;">
                            <strong>No individual selected</strong><br>
                            <div style="font-size: 12px; margin-top: 10px;">
                                • Click an individual to select<br>
                                • Right-click to toggle affected status<br>
                                • Drag to move individuals
                            </div>
                        </div>
                    `;
                }
            }
            
            /**
             * Redraw the entire pedigree chart.
             */
            draw() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw relations first
                this.ctx.strokeStyle = '#666';
                this.ctx.lineWidth = 2;
                
                for (let relation of this.relations) {
                    if (relation.type === 'parent') {
                        this.ctx.beginPath();
                        this.ctx.moveTo(relation.parent.x, relation.parent.y);
                        this.ctx.lineTo(relation.child.x, relation.child.y);
                        this.ctx.stroke();
                    } else if (relation.type === 'partner') {
                        const [ind1, ind2] = relation.individuals;
                        this.ctx.beginPath();
                        this.ctx.moveTo(ind1.x, ind1.y);
                        this.ctx.lineTo(ind2.x, ind2.y);
                        this.ctx.stroke();
                    }
                }
                
                // Draw individuals
                for (let individual of this.individuals) {
                    this.drawIndividual(individual);
                }
                
                // Highlight pending relation
                if (this.pendingRelation) {
                    this.ctx.strokeStyle = '#ff0000';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(this.pendingRelation.x, this.pendingRelation.y, 25, 0, 2 * Math.PI);
                    this.ctx.stroke();
                }
            }
            
            /**
             * Draw a single individual node.
             * @param {Individual} individual
             */
            drawIndividual(individual) {
                const x = individual.x;
                const y = individual.y;
                const size = 20;
                
                // Determine colors
                let fillColor = individual.affected ? '#ff4444' : '#fff';
                let strokeColor = '#333';
                
                if (this.needsRaceInput.has(individual)) {
                    fillColor = '#ffcccc'; // Flash color for missing race
                    strokeColor = '#ff6666';
                }
                
                if (individual.hypothetical) {
                    strokeColor = '#007bff';
                    this.ctx.setLineDash([5, 5]);
                } else {
                    this.ctx.setLineDash([]);
                }
                
                if (individual === this.selectedIndividual) {
                    strokeColor = '#28a745';
                    this.ctx.lineWidth = 4;
                } else {
                    this.ctx.lineWidth = 2;
                }
                
                this.ctx.fillStyle = fillColor;
                this.ctx.strokeStyle = strokeColor;
                
                // Draw shape based on gender
                if (individual.gender === 'M') {
                    // Square for male
                    this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
                    this.ctx.strokeRect(x - size, y - size, size * 2, size * 2);
                } else {
                    // Circle for female
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
                
                // Add visual indicator for affected individuals
                if (individual.affected) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('A', x, y + 4);
                }
                
                // Draw ID
                this.ctx.fillStyle = '#000';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(individual.id.toString(), x, y + (individual.affected ? 40 : 35));
                
                // Draw probabilities
                this.ctx.font = '8px Arial';
                const probs = individual.probabilities.map(p => p.toFixed(2));
                this.ctx.fillText(`${probs[0]} ${probs[1]}`, x, y - 30);
                this.ctx.fillText(`${probs[2]} ${probs[3]}`, x, y - 22);
                
                this.ctx.setLineDash([]);
            }
            
            /**
             * Compute the negative log-likelihood for the current pedigree.
             * @returns {number}
             */
            calculateNegativeLogLikelihood() {
                let logLikelihood = 0;
                
                for (let individual of this.individuals) {
                    // Skip hypothetical individuals - they don't contribute to likelihood
                    if (individual.hypothetical) {
                        continue;
                    }
                    
                    if (individual.affected) {
                        // Probability of being affected (pos-pos)
                        const prob = individual.probabilities[3];
                        if (prob > 0) {
                            logLikelihood += Math.log(prob);
                        } else {
                            logLikelihood += Math.log(1e-10); // Avoid log(0)
                        }
                    } else {
                        // Probability of being unaffected (neg-neg + neg-pos + pos-neg)
                        const prob = individual.probabilities[0] + individual.probabilities[1] + individual.probabilities[2];
                        if (prob > 0) {
                            logLikelihood += Math.log(prob);
                        } else {
                            logLikelihood += Math.log(1e-10);
                        }
                    }
                }
                
                return -logLikelihood;
            }
        }
        
        // Population frequency data
        const populationFrequencies = {
            'cf': {
                'european_ancestry': 0.029,
                'african_american': 0.0067,
                'general': 0.025,
                'custom1': 0.0,
                'custom2': 0.0
            },
            'sma': {
                'european_ancestry': 0.017,
                'african_american': 0.019,
                'general': 0.018,
                'custom1': 0.0,
                'custom2': 0.0
            },
            'tay': {
                'european_ancestry': 0.0034,
                'african_american': 0.0013,
                'general': 0.002,
                'custom1': 0.0,
                'custom2': 0.0
            },
            'pku': {
                'european_ancestry': 0.02,
                'african_american': 0.005,
                'general': 0.015,
                'custom1': 0.0,
                'custom2': 0.0
            },
            'hemo': {
                'european_ancestry': 0.11,
                'african_american': 0.014,
                'general': 0.08,
                'custom1': 0.0,
                'custom2': 0.0
            }
        };
        
        /**
         * Look up the carrier frequency for a race and current condition.
         * @param {string} race
         * @returns {number|null}
         */
        function getCarrierFrequency(race) {
            const condition = document.getElementById('conditionSelect').value;
            return populationFrequencies[condition][race] || null;
        }
        
        /**
         * Render the editable table of carrier frequencies.
         */
        function updateFrequencyTable() {
            const condition = document.getElementById('conditionSelect').value;
            const tbody = document.getElementById('frequencyTableBody');
            
            tbody.innerHTML = '';
            
            const populations = ['european_ancestry', 'african_american', 'general', 'custom1', 'custom2'];
            const populationNames = {
                'european_ancestry': 'European Ancestry',
                'african_american': 'African American',
                'general': 'General Population',
                'custom1': 'Custom 1',
                'custom2': 'Custom 2'
            };
            
            for (let pop of populations) {
                const row = tbody.insertRow();
                const nameCell = row.insertCell();
                const freqCell = row.insertCell();
                
                nameCell.textContent = populationNames[pop];
                
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.001';
                input.min = '0';
                input.max = '1';
                input.value = populationFrequencies[condition][pop];
                
                input.addEventListener('change', (e) => {
                    populationFrequencies[condition][pop] = parseFloat(e.target.value) || 0;
                    pedigreeChart.updateAllProbabilities();
                    pedigreeChart.draw();
                });
                
                freqCell.appendChild(input);
            }
        }

        /**
         * Automatically layout individuals based on parent-child levels.
         * @param {PedigreeChart} chart
         */
        function autoLayout(chart, options = {}) {
            const xSpacing = options.xSpacing || 120;
            const ySpacing = options.ySpacing || 100;

            const levelMap = new Map();
            const queue = [];

            for (const ind of chart.individuals) {
                if (ind.parents.length === 0) {
                    levelMap.set(ind, 0);
                    queue.push(ind);
                }
            }

            while (queue.length) {
                const ind = queue.shift();
                const level = levelMap.get(ind);
                for (const child of ind.children) {
                    const childLevel = level + 1;
                    if (!levelMap.has(child) || childLevel > levelMap.get(child)) {
                        levelMap.set(child, childLevel);
                        queue.push(child);
                    }
                }
            }

            const groups = new Map();
            for (const [ind, lvl] of levelMap.entries()) {
                if (!groups.has(lvl)) groups.set(lvl, []);
                groups.get(lvl).push(ind);
            }

            const levels = Array.from(groups.keys()).sort((a, b) => a - b);
            for (const lvl of levels) {
                const inds = groups.get(lvl);
                inds.sort((a, b) => a.id - b.id);

                const ordered = [];
                const used = new Set();
                for (const ind of inds) {
                    if (used.has(ind)) continue;
                    if (ind.partner && inds.includes(ind.partner)) {
                        ordered.push(ind, ind.partner);
                        used.add(ind);
                        used.add(ind.partner);
                    } else {
                        ordered.push(ind);
                        used.add(ind);
                    }
                }

                let x = xSpacing;
                for (const ind of ordered) {
                    ind.x = x;
                    ind.y = lvl * ySpacing + ySpacing;
                    x += xSpacing;
                }
            }
        }
        
        // Optimization algorithm
        /**
         * Simple simulated annealing optimizer for genotype probabilities.
         */
        class Optimizer {
            /**
             * @param {PedigreeChart} pedigreeChart
             */
            constructor(pedigreeChart) {
                this.pedigreeChart = pedigreeChart;
                this.running = false;
                this.iterations = 0;
                this.currentLikelihood = 0;
                this.bestLikelihood = Infinity;
                this.noImprovementCount = 0;
                this.temperature = 1.0;
                this.coolingRate = 0.995;
                this.debugMode = true;
                this.timeoutId = null; // Store timeout ID for cancellation
            }
            
            /** Start the optimization loop. */
            start() {
                this.running = true;
                this.iterations = 0;
                this.currentLikelihood = this.pedigreeChart.calculateNegativeLogLikelihood();
                this.bestLikelihood = this.currentLikelihood;
                this.noImprovementCount = 0;
                this.temperature = 1.0;
                
                console.log("=== OPTIMIZATION STARTED ===");
                console.log(`Initial negative log-likelihood: ${this.currentLikelihood}`);
                console.log(`Number of individuals: ${this.pedigreeChart.individuals.length}`);
                
                document.getElementById('startOptBtn').disabled = true;
                document.getElementById('stepOptBtn').disabled = true;
                document.getElementById('stopOptBtn').disabled = false;
                document.getElementById('optStatus').textContent = 'Running';
                
                this.step();
            }
            
            /** Perform a single optimization iteration. */
            stepOnce() {
                if (this.running) {
                    console.log("Cannot step while optimization is running");
                    return;
                }
                
                // Initialize if first step
                if (this.iterations === 0) {
                    this.currentLikelihood = this.pedigreeChart.calculateNegativeLogLikelihood();
                    this.bestLikelihood = this.currentLikelihood;
                    this.noImprovementCount = 0;
                    this.temperature = 1.0;
                    console.log("=== SINGLE STEP MODE ===");
                    console.log(`Initial negative log-likelihood: ${this.currentLikelihood}`);
                }
                
                this.performSingleStep();
            }
            
            /** Stop the optimization process. */
            stop() {
                console.log("=== STOP BUTTON CLICKED ===");
                this.running = false;
                
                // Clear any pending timeout
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                    this.timeoutId = null;
                    console.log("Cleared pending timeout");
                }
                
                document.getElementById('startOptBtn').disabled = false;
                document.getElementById('stepOptBtn').disabled = false;
                document.getElementById('stopOptBtn').disabled = true;
                document.getElementById('optStatus').textContent = 'Stopped';
                console.log("=== OPTIMIZATION STOPPED ===");
            }
            
            /**
             * Execute one simulated annealing step.
             */
            performSingleStep() {
                console.log(`\n--- Iteration ${this.iterations + 1} ---`);
                console.log(`Current temperature: ${this.temperature.toFixed(4)}`);
                console.log(`Current negative log-likelihood: ${this.currentLikelihood.toFixed(6)}`);
                
                // Pick a random unaffected individual
                const unaffectedIndividuals = this.pedigreeChart.individuals.filter(
                    ind => !ind.affected && !ind.frozen && ind.parents.length === 0
                );
                
                console.log(`Unaffected founder individuals available: ${unaffectedIndividuals.length}`);
                
                if (unaffectedIndividuals.length === 0) {
                    console.log("No unaffected founder individuals to optimize - stopping");
                    this.stop();
                    return;
                }
                
                const individual = unaffectedIndividuals[Math.floor(Math.random() * unaffectedIndividuals.length)];
                console.log(`Selected individual ${individual.id} for optimization`);
                console.log(`Individual ${individual.id} current probabilities:`, individual.probabilities.map(p => p.toFixed(4)));
                
                // Store original probabilities
                const originalProbs = [...individual.probabilities];
                
                // Propose a meaningful change (increased from 0.01 to 0.05 for better optimization)
                const changeAmount = 0.05;
                const changeType = Math.random() < 0.5 ? 'neg-neg' : 'carrier';
                console.log(`Proposing change type: ${changeType}, amount: ${changeAmount}`);
                
                if (changeType === 'neg-neg') {
                    // Adjust neg-neg vs others
                    const change = (Math.random() - 0.5) * changeAmount;
                    console.log(`Adjusting neg-neg by: ${change.toFixed(4)}`);
                    individual.probabilities[0] = Math.max(0, Math.min(1, individual.probabilities[0] + change));
                    
                    // Redistribute the rest
                    const remaining = 1 - individual.probabilities[0];
                    const totalOther = individual.probabilities[1] + individual.probabilities[2] + individual.probabilities[3];
                    
                    if (totalOther > 0) {
                        const scale = remaining / totalOther;
                        individual.probabilities[1] *= scale;
                        individual.probabilities[2] *= scale;
                        individual.probabilities[3] *= scale;
                    }
                } else {
                    // Adjust carrier probabilities (neg-pos and pos-neg should be equal)
                    const change = (Math.random() - 0.5) * changeAmount;
                    const currentCarrier = (individual.probabilities[1] + individual.probabilities[2]) / 2;
                    console.log(`Current carrier probability: ${currentCarrier.toFixed(4)}, proposing change: ${change.toFixed(4)}`);
                    const newCarrier = Math.max(0, Math.min(0.5, currentCarrier + change));
                    
                    individual.probabilities[1] = newCarrier;
                    individual.probabilities[2] = newCarrier;
                    
                    // Redistribute remaining
                    const remaining = 1 - 2 * newCarrier;
                    const totalOther = individual.probabilities[0] + individual.probabilities[3];
                    
                    if (totalOther > 0) {
                        const scale = remaining / totalOther;
                        individual.probabilities[0] *= scale;
                        individual.probabilities[3] *= scale;
                    }
                }
                
                // Normalize to ensure sum = 1
                const sum = individual.probabilities.reduce((a, b) => a + b, 0);
                if (sum > 0) {
                    individual.probabilities = individual.probabilities.map(p => p / sum);
                }
                
                console.log(`Individual ${individual.id} proposed probabilities:`, individual.probabilities.map(p => p.toFixed(4)));
                
                // Update all dependent probabilities
                this.pedigreeChart.updateAllProbabilities();
                
                // Calculate new likelihood
                const newLikelihood = this.pedigreeChart.calculateNegativeLogLikelihood();
                console.log(`New negative log-likelihood: ${newLikelihood.toFixed(6)}`);
                
                // Accept or reject change
                const deltaE = newLikelihood - this.currentLikelihood;
                console.log(`Delta energy: ${deltaE.toFixed(6)}`);
                
                const acceptProb = deltaE < 0 ? 1.0 : Math.exp(-deltaE / this.temperature);
                const randomVal = Math.random();
                const accept = randomVal < acceptProb;
                
                console.log(`Accept probability: ${acceptProb.toFixed(4)}, random value: ${randomVal.toFixed(4)}, accept: ${accept}`);
                
                if (accept) {
                    this.currentLikelihood = newLikelihood;
                    if (newLikelihood < this.bestLikelihood) {
                        this.bestLikelihood = newLikelihood;
                        this.noImprovementCount = 0;
                        console.log(`*** NEW BEST LIKELIHOOD: ${this.bestLikelihood.toFixed(6)} ***`);
                    } else {
                        this.noImprovementCount++;
                    }
                    console.log("CHANGE ACCEPTED");
                } else {
                    // Reject change - restore original probabilities
                    individual.probabilities = originalProbs;
                    this.pedigreeChart.updateAllProbabilities();
                    this.noImprovementCount++;
                    console.log("CHANGE REJECTED - probabilities restored");
                }
                
                this.iterations++;
                
                // Adaptive cooling: only cool down if we're making progress
                // If no improvement for a while, maintain higher temperature for exploration
                if (this.noImprovementCount < 100) {
                    // Making progress - cool down normally
                    this.temperature *= this.coolingRate;
                } else if (this.noImprovementCount < 500) {
                    // Slow progress - cool down more slowly
                    this.temperature *= 0.9995;
                } else {
                    // No progress - maintain temperature for exploration
                    // Only very slight cooling to prevent complete stagnation
                    this.temperature *= 0.9999;
                }
                
                // Update display
                document.getElementById('iterationCount').textContent = this.iterations;
                document.getElementById('likelihood').textContent = this.currentLikelihood.toFixed(3);
                
                // Check stopping criteria every 1000 iterations
                if (this.iterations % 1000 === 0) {
                    console.log(`=== CHECKPOINT AT ${this.iterations} ITERATIONS ===`);
                    console.log(`No improvement count: ${this.noImprovementCount}`);
                    if (this.noImprovementCount > 5000) {
                        this.stop();
                        document.getElementById('optStatus').textContent = 'Converged';
                        console.log("OPTIMIZATION CONVERGED");
                        return;
                    }
                }
                
                this.pedigreeChart.draw();
            }
            
            /** Continue stepping while running. */
            step() {
                // Check if we should stop FIRST
                if (!this.running) {
                    console.log("Step called but running=false, exiting");
                    return;
                }
                
                this.performSingleStep();
                
                // Only continue if still running (in case stop was called during step)
                if (this.running) {
                    this.timeoutId = setTimeout(() => this.step(), 1);
                } else {
                    console.log("Running set to false during step, not scheduling next step");
                }
            }
            
            /** Reset probabilities to their original values. */
            reset() {
                // Stop any running optimization first
                this.stop();
                
                for (let individual of this.pedigreeChart.individuals) {
                    if (!individual.frozen) {
                        individual.probabilities = [...individual.originalProbabilities];
                    }
                }
                this.pedigreeChart.updateAllProbabilities();
                this.pedigreeChart.draw();
                
                this.iterations = 0;
                this.currentLikelihood = this.pedigreeChart.calculateNegativeLogLikelihood();
                
                document.getElementById('iterationCount').textContent = '0';
                document.getElementById('likelihood').textContent = this.currentLikelihood.toFixed(3);
                document.getElementById('optStatus').textContent = 'Reset';
                
                console.log("=== OPTIMIZATION RESET ===");
                console.log(`Reset to negative log-likelihood: ${this.currentLikelihood}`);
            }
        }
        
        // Initialize application
        let pedigreeChart;
        let optimizer;
        
        window.addEventListener('load', () => {
            const canvas = document.getElementById('pedigreeCanvas');
            pedigreeChart = new PedigreeChart(canvas);
            optimizer = new Optimizer(pedigreeChart);

            // Set up event listeners
            document.getElementById('conditionSelect').addEventListener('change', updateFrequencyTable);
            document.getElementById('startOptBtn').addEventListener('click', () => optimizer.start());
            document.getElementById('stepOptBtn').addEventListener('click', () => optimizer.stepOnce());
            document.getElementById('stopOptBtn').addEventListener('click', () => optimizer.stop());
            document.getElementById('resetBtn').addEventListener('click', () => optimizer.reset());
            document.getElementById('loadFileBtn').addEventListener('click', () => document.getElementById('loadFileInput').click());
            document.getElementById('loadFileInput').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const obj = JSON.parse(reader.result);
                        pedigreeChart.loadFromObject(obj);
                    } catch (err) {
                        alert('Failed to load file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });

            // Initialize frequency table
            updateFrequencyTable();
        });
