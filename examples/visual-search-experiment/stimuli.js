/**
 * Visual Search Stimuli Generator
 *
 * Generates search displays for feature and conjunction search tasks.
 * - Feature search: Target differs from distractors by a single feature (e.g., color OR shape)
 * - Conjunction search: Target differs by a combination of features (e.g., color AND shape)
 *
 * Stimuli: X's and O's in red and blue
 */

const VisualSearchStimuli = (function() {
    // Stimulus parameters
    const ITEM_SIZE = 36; // pixels
    const ITEM_STROKE_WIDTH = 4;
    const MIN_SPACING = 60; // minimum distance between item centers
    const DISPLAY_PADDING = 100; // padding from screen edges

    // Colors (more saturated blue)
    const COLORS = {
        red: '#E53935',
        blue: '#0D47A1'  // More saturated blue
    };

    // Shapes
    const SHAPES = {
        X: 'X',
        O: 'O'
    };

    /**
     * Generate a random position that doesn't overlap with existing positions
     */
    function generatePosition(existingPositions, displayWidth, displayHeight) {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = DISPLAY_PADDING + Math.random() * (displayWidth - 2 * DISPLAY_PADDING);
            const y = DISPLAY_PADDING + Math.random() * (displayHeight - 2 * DISPLAY_PADDING);

            // Check for overlap with existing positions
            let overlaps = false;
            for (const pos of existingPositions) {
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                if (distance < MIN_SPACING) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                return { x, y };
            }

            attempts++;
        }

        // Fallback: return a grid position if random placement fails
        const gridCols = Math.floor((displayWidth - 2 * DISPLAY_PADDING) / MIN_SPACING);
        const index = existingPositions.length;
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        return {
            x: DISPLAY_PADDING + col * MIN_SPACING + Math.random() * 20 - 10,
            y: DISPLAY_PADDING + row * MIN_SPACING + Math.random() * 20 - 10
        };
    }

    /**
     * Create SVG for a single item (X or O)
     */
    function createItemSVG(color, shape, x, y) {
        const halfSize = ITEM_SIZE / 2;

        if (shape === SHAPES.X) {
            // Draw an X
            return `<line x1="${x - halfSize}" y1="${y - halfSize}" x2="${x + halfSize}" y2="${y + halfSize}"
                          stroke="${color}" stroke-width="${ITEM_STROKE_WIDTH}" stroke-linecap="round"/>
                    <line x1="${x + halfSize}" y1="${y - halfSize}" x2="${x - halfSize}" y2="${y + halfSize}"
                          stroke="${color}" stroke-width="${ITEM_STROKE_WIDTH}" stroke-linecap="round"/>`;
        } else {
            // Draw an O (circle)
            return `<circle cx="${x}" cy="${y}" r="${halfSize}"
                            stroke="${color}" stroke-width="${ITEM_STROKE_WIDTH}" fill="none"/>`;
        }
    }

    /**
     * Generate a feature search display
     * Target differs from distractors by ONE feature (color OR shape)
     *
     * @param {number} setSize - Number of items in the display
     * @param {boolean} targetPresent - Whether the target is present
     * @param {string} featureType - 'color' or 'shape'
     * @param {number} displayWidth - Width of display area
     * @param {number} displayHeight - Height of display area
     * @returns {Object} Display configuration and HTML
     */
    function generateFeatureSearchDisplay(setSize, targetPresent, featureType, displayWidth, displayHeight) {
        const positions = [];
        const items = [];

        // Define target and distractor features
        let targetColor, targetShape, distractorColor, distractorShape;

        // Target is always red X
        targetColor = COLORS.red;
        targetShape = SHAPES.X;

        if (featureType === 'color') {
            // Color feature search: red X target among blue X distractors
            distractorColor = COLORS.blue;
            distractorShape = SHAPES.X;
        } else {
            // Shape feature search: red X target among red O distractors
            distractorColor = COLORS.red;
            distractorShape = SHAPES.O;
        }

        // Generate positions
        for (let i = 0; i < setSize; i++) {
            positions.push(generatePosition(positions, displayWidth, displayHeight));
        }

        // Determine target position (if present)
        const targetIndex = targetPresent ? Math.floor(Math.random() * setSize) : -1;

        // Create items
        for (let i = 0; i < setSize; i++) {
            const isTarget = i === targetIndex;
            const color = isTarget ? targetColor : distractorColor;
            const shape = isTarget ? targetShape : distractorShape;

            items.push({
                x: positions[i].x,
                y: positions[i].y,
                color: color,
                shape: shape,
                isTarget: isTarget
            });
        }

        // Generate SVG
        const svg = generateSVG(items, displayWidth, displayHeight);

        return {
            html: svg,
            items: items,
            targetPosition: targetPresent ? positions[targetIndex] : null,
            searchType: 'feature',
            featureType: featureType,
            setSize: setSize,
            targetPresent: targetPresent
        };
    }

    /**
     * Generate a conjunction search display
     * Target differs from distractors by a COMBINATION of features (color AND shape)
     *
     * Target: Red X
     * Distractors: Red O's AND Blue X's
     *
     * @param {number} setSize - Number of items in the display
     * @param {boolean} targetPresent - Whether the target is present
     * @param {number} displayWidth - Width of display area
     * @param {number} displayHeight - Height of display area
     * @returns {Object} Display configuration and HTML
     */
    function generateConjunctionSearchDisplay(setSize, targetPresent, displayWidth, displayHeight) {
        const positions = [];
        const items = [];

        // Target: Red X
        const targetColor = COLORS.red;
        const targetShape = SHAPES.X;

        // Generate positions
        for (let i = 0; i < setSize; i++) {
            positions.push(generatePosition(positions, displayWidth, displayHeight));
        }

        // Determine target position (if present)
        const targetIndex = targetPresent ? Math.floor(Math.random() * setSize) : -1;

        // Create items
        const numDistractors = targetPresent ? setSize - 1 : setSize;
        let distractorTypes = [];

        // Create equal numbers of each distractor type (3 types: Red O, Blue X, Blue O)
        for (let i = 0; i < numDistractors; i++) {
            const type = i % 3;
            if (type === 0) {
                // Red O (same color, different shape)
                distractorTypes.push({ color: COLORS.red, shape: SHAPES.O });
            } else if (type === 1) {
                // Blue X (different color, same shape)
                distractorTypes.push({ color: COLORS.blue, shape: SHAPES.X });
            } else {
                // Blue O (different color, different shape)
                distractorTypes.push({ color: COLORS.blue, shape: SHAPES.O });
            }
        }

        // Shuffle distractor types
        distractorTypes = shuffleArray(distractorTypes);

        let distractorIndex = 0;
        for (let i = 0; i < setSize; i++) {
            const isTarget = i === targetIndex;

            let color, shape;
            if (isTarget) {
                color = targetColor;
                shape = targetShape;
            } else {
                color = distractorTypes[distractorIndex].color;
                shape = distractorTypes[distractorIndex].shape;
                distractorIndex++;
            }

            items.push({
                x: positions[i].x,
                y: positions[i].y,
                color: color,
                shape: shape,
                isTarget: isTarget
            });
        }

        // Generate SVG
        const svg = generateSVG(items, displayWidth, displayHeight);

        return {
            html: svg,
            items: items,
            targetPosition: targetPresent ? positions[targetIndex] : null,
            searchType: 'conjunction',
            featureType: 'color_and_shape',
            setSize: setSize,
            targetPresent: targetPresent
        };
    }

    /**
     * Generate SVG element from items
     */
    function generateSVG(items, width, height) {
        let svgContent = '';
        for (const item of items) {
            svgContent += createItemSVG(item.color, item.shape, item.x, item.y);
        }

        return `<svg width="${width}" height="${height}" class="search-display">
                    ${svgContent}
                </svg>`;
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate a block of trials with balanced conditions
     *
     * @param {Object} params - Trial generation parameters
     * @param {number} params.numTrials - Number of trials in the block
     * @param {number[]} params.setSizes - Array of set sizes to use
     * @param {string[]} params.searchTypes - Array of search types ('feature', 'conjunction')
     * @param {number} params.displayWidth - Display width in pixels
     * @param {number} params.displayHeight - Display height in pixels
     * @returns {Object[]} Array of trial configurations
     */
    function generateTrialBlock(params) {
        const {
            numTrials = 40,
            setSizes = [4, 8, 16, 32],
            searchTypes = ['feature', 'conjunction'],
            displayWidth = 800,
            displayHeight = 600
        } = params;

        const trials = [];

        // Create balanced trials across conditions
        for (let i = 0; i < numTrials; i++) {
            const searchType = searchTypes[i % searchTypes.length];
            const setSize = setSizes[Math.floor(i / 2) % setSizes.length];
            const targetPresent = i % 2 === 0; // Alternate present/absent

            trials.push({
                searchType: searchType,
                setSize: setSize,
                targetPresent: targetPresent,
                displayWidth: displayWidth,
                displayHeight: displayHeight
            });
        }

        // Shuffle trial order
        return shuffleArray(trials);
    }

    /**
     * Generate a complete trial list for the experiment (legacy)
     */
    function generateTrialList(params) {
        return generateTrialBlock(params);
    }

    /**
     * Generate a display for a given trial configuration
     */
    function generateDisplayForTrial(trial) {
        if (trial.searchType === 'feature') {
            // Alternate between color and shape feature search
            const featureType = Math.random() < 0.5 ? 'color' : 'shape';
            return generateFeatureSearchDisplay(
                trial.setSize,
                trial.targetPresent,
                featureType,
                trial.displayWidth,
                trial.displayHeight
            );
        } else {
            return generateConjunctionSearchDisplay(
                trial.setSize,
                trial.targetPresent,
                trial.displayWidth,
                trial.displayHeight
            );
        }
    }

    // Public API
    return {
        generateFeatureSearchDisplay,
        generateConjunctionSearchDisplay,
        generateTrialBlock,
        generateTrialList,
        generateDisplayForTrial,
        shuffleArray,
        COLORS,
        SHAPES,
        ITEM_SIZE
    };
})();
