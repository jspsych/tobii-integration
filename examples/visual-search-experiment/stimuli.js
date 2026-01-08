/**
 * Visual Search Stimuli Generator
 *
 * Generates search displays for feature and conjunction search tasks.
 * - Feature search: Target differs from distractors by a single feature (e.g., color OR orientation)
 * - Conjunction search: Target differs by a combination of features (e.g., color AND orientation)
 */

const VisualSearchStimuli = (function() {
    // Stimulus parameters
    const ITEM_SIZE = 40; // pixels
    const ITEM_STROKE_WIDTH = 4;
    const MIN_SPACING = 60; // minimum distance between item centers
    const DISPLAY_PADDING = 100; // padding from screen edges

    // Colors
    const COLORS = {
        red: '#E53935',
        blue: '#1E88E5'
    };

    // Orientations (in degrees)
    const ORIENTATIONS = {
        vertical: 0,
        horizontal: 90
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
     * Create SVG for a single item (oriented bar)
     */
    function createItemSVG(color, orientation, x, y) {
        const halfSize = ITEM_SIZE / 2;
        const rad = (orientation * Math.PI) / 180;

        // Calculate line endpoints
        const x1 = x - halfSize * Math.sin(rad);
        const y1 = y - halfSize * Math.cos(rad);
        const x2 = x + halfSize * Math.sin(rad);
        const y2 = y + halfSize * Math.cos(rad);

        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                      stroke="${color}" stroke-width="${ITEM_STROKE_WIDTH}"
                      stroke-linecap="round"/>`;
    }

    /**
     * Generate a feature search display
     * Target differs from distractors by ONE feature (color OR orientation)
     *
     * @param {number} setSize - Number of items in the display
     * @param {boolean} targetPresent - Whether the target is present
     * @param {string} featureType - 'color' or 'orientation'
     * @param {number} displayWidth - Width of display area
     * @param {number} displayHeight - Height of display area
     * @returns {Object} Display configuration and HTML
     */
    function generateFeatureSearchDisplay(setSize, targetPresent, featureType, displayWidth, displayHeight) {
        const positions = [];
        const items = [];

        // Define target and distractor features
        let targetColor, targetOrientation, distractorColor, distractorOrientation;

        // Target is always red vertical bar
        targetColor = COLORS.red;
        targetOrientation = ORIENTATIONS.vertical;

        if (featureType === 'color') {
            // Color feature search: red vertical target among blue vertical distractors
            distractorColor = COLORS.blue;
            distractorOrientation = ORIENTATIONS.vertical;
        } else {
            // Orientation feature search: red vertical target among red horizontal distractors
            distractorColor = COLORS.red;
            distractorOrientation = ORIENTATIONS.horizontal;
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
            const orientation = isTarget ? targetOrientation : distractorOrientation;

            items.push({
                x: positions[i].x,
                y: positions[i].y,
                color: color,
                orientation: orientation,
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
     * Target differs from distractors by a COMBINATION of features (color AND orientation)
     *
     * Target: Red vertical bar
     * Distractors: Red horizontal bars AND Green vertical bars
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

        // Target: Red vertical
        const targetColor = COLORS.red;
        const targetOrientation = ORIENTATIONS.vertical;

        // Generate positions
        for (let i = 0; i < setSize; i++) {
            positions.push(generatePosition(positions, displayWidth, displayHeight));
        }

        // Determine target position (if present)
        const targetIndex = targetPresent ? Math.floor(Math.random() * setSize) : -1;

        // Create items
        const numDistractors = targetPresent ? setSize - 1 : setSize;
        let distractorTypes = [];

        // Create equal numbers of each distractor type
        for (let i = 0; i < numDistractors; i++) {
            if (i % 2 === 0) {
                // Red horizontal
                distractorTypes.push({ color: COLORS.red, orientation: ORIENTATIONS.horizontal });
            } else {
                // Blue vertical
                distractorTypes.push({ color: COLORS.blue, orientation: ORIENTATIONS.vertical });
            }
        }

        // Shuffle distractor types
        distractorTypes = shuffleArray(distractorTypes);

        let distractorIndex = 0;
        for (let i = 0; i < setSize; i++) {
            const isTarget = i === targetIndex;

            let color, orientation;
            if (isTarget) {
                color = targetColor;
                orientation = targetOrientation;
            } else {
                color = distractorTypes[distractorIndex].color;
                orientation = distractorTypes[distractorIndex].orientation;
                distractorIndex++;
            }

            items.push({
                x: positions[i].x,
                y: positions[i].y,
                color: color,
                orientation: orientation,
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
            featureType: 'color_and_orientation',
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
            svgContent += createItemSVG(item.color, item.orientation, item.x, item.y);
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
            // Alternate between color and orientation feature search
            const featureType = Math.random() < 0.5 ? 'color' : 'orientation';
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
        ORIENTATIONS,
        ITEM_SIZE
    };
})();
