/**
 * Visual Search Experiment with Eye Tracking
 *
 * Manipulates:
 * - Set size (4, 8, 16, 32 items)
 * - Search type (feature vs. conjunction)
 * - Target presence (present vs. absent)
 *
 * Participants respond with keyboard:
 * - 'P' key for target present
 * - 'A' key for target absent
 *
 * Eye tracking is recorded throughout all trials.
 */

// Experiment configuration
const CONFIG = {
    // Set sizes to test
    setSizes: [4, 8, 16, 32],

    // Number of blocks and trials
    numBlocks: 2,
    trialsPerBlock: 32,  // 16 conditions × 2 repetitions

    // Response keys
    presentKey: 'p',
    absentKey: 'a',

    // Timing (in ms)
    fixationDuration: 500,
    feedbackDuration: 500,
    interTrialInterval: 300,

    // Display dimensions (will be updated on fullscreen)
    displayWidth: 1200,
    displayHeight: 800,

    // Practice trials per search type
    practiceTrialsPerType: 4,

    // Eye tracking
    calibrationPoints: 9,
    validationPoints: 5
};

// Initialize jsPsych with Tobii extension
const jsPsych = initJsPsych({
    extensions: [
        {
            type: jsPsychExtensionTobii,
            params: {
                connection: {
                    url: 'ws://localhost:8080',
                    autoConnect: true,
                },
            },
        },
    ],
    on_finish: function () {
        // Export all data as JSON
        jsPsych.data.get().localSave('json', `visual_search_data_${jsPsych.data.get().values()[0].subject}.json`);

        // Display completion message
        jsPsych.data.displayData();
    }
});

// Add random subject ID
jsPsych.data.addProperties({
    subject: jsPsych.randomization.randomID(12)
});

// Create timeline
const timeline = [];

// Store current display info (used to pass data from stimulus function to on_finish)
let currentDisplayInfo = null;

// ============================================================================
// WELCOME AND CONSENT
// ============================================================================

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instructions">
            <h1>Visual Search Experiment</h1>
            <p>Welcome! In this experiment, you will search for a target item among distractors.</p>
            <p>Your eye movements will be recorded using an eye tracker.</p>
            <p>The experiment takes approximately 10 minutes to complete.</p>
            <hr>
            <p>Press <strong>any key</strong> to continue.</p>
        </div>
    `,
});

// ============================================================================
// FULLSCREEN
// ============================================================================

timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `
        <div class="instructions">
            <p>The experiment will switch to fullscreen mode.</p>
            <p>Please remain in fullscreen for the duration of the experiment.</p>
        </div>
    `,
    button_label: 'Enter Fullscreen',
    on_finish: function() {
        // Update display dimensions based on screen size
        CONFIG.displayWidth = window.innerWidth - 100;
        CONFIG.displayHeight = window.innerHeight - 100;
    }
});

// ============================================================================
// EYE TRACKER SETUP
// ============================================================================

// User position guide
timeline.push({
    type: jsPsychTobiiUserPosition,
    instructions: `
        <p>Please adjust your position so that your eyes are centered and at the correct distance.</p>
        <p>Press <strong>SPACE</strong> when you're in position to continue.</p>
    `
});

// Calibration
timeline.push({
    type: jsPsychTobiiCalibration,
    calibration_points: CONFIG.calibrationPoints,
    point_size: 25,
    animation: 'shrink',
});

// Validation
timeline.push({
    type: jsPsychTobiiValidation,
    validation_points: CONFIG.validationPoints,
    show_feedback: true,
});

// ============================================================================
// TASK INSTRUCTIONS
// ============================================================================

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instructions">
            <h2>Task Instructions</h2>
            <p>On each trial, you will see a display of X's and O's.</p>
            <p>Your task is to search for the <strong>TARGET</strong>:</p>

            <div class="target-example">
                <svg width="100" height="100">
                    <line x1="30" y1="30" x2="70" y2="70"
                          stroke="${VisualSearchStimuli.COLORS.red}" stroke-width="6" stroke-linecap="round"/>
                    <line x1="70" y1="30" x2="30" y2="70"
                          stroke="${VisualSearchStimuli.COLORS.red}" stroke-width="6" stroke-linecap="round"/>
                </svg>
                <p><strong>Red X</strong></p>
            </div>

            <p>Press <strong>'P'</strong> if the target is <strong>PRESENT</strong></p>
            <p>Press <strong>'A'</strong> if the target is <strong>ABSENT</strong></p>

            <p>Respond as <strong>quickly and accurately</strong> as possible.</p>
            <hr>
            <p>Press <strong>any key</strong> to see an example display.</p>
        </div>
    `,
});

// ============================================================================
// EXAMPLE DISPLAYS
// ============================================================================

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        const exampleDisplay = VisualSearchStimuli.generateConjunctionSearchDisplay(
            8, true, 600, 400
        );
        return `
            <div class="instructions">
                <h2>Example Display</h2>
                <p>Here is an example of a search display.</p>
                <p>Look for the <strong>red X</strong> among the other items.</p>
                <div class="example-display">
                    ${exampleDisplay.html}
                </div>
                <p><em>The target is PRESENT in this display.</em></p>
                <hr>
                <p>Press <strong>any key</strong> to continue.</p>
            </div>
        `;
    },
});

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        const exampleDisplay = VisualSearchStimuli.generateConjunctionSearchDisplay(
            8, false, 600, 400
        );
        return `
            <div class="instructions">
                <h2>Example Display</h2>
                <p>Here is another example of a search display.</p>
                <div class="example-display">
                    ${exampleDisplay.html}
                </div>
                <p><em>The target is ABSENT in this display.</em></p>
                <hr>
                <p>Press <strong>any key</strong> to continue.</p>
            </div>
        `;
    },
});

// ============================================================================
// PRACTICE TRIALS
// ============================================================================

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instructions">
            <h2>Practice Trials</h2>
            <p>Let's start with some practice trials.</p>
            <p>You will receive feedback on your responses.</p>
            <p>Remember:</p>
            <p><strong>'P'</strong> = Target Present &nbsp;&nbsp;&nbsp; <strong>'A'</strong> = Target Absent</p>
            <hr>
            <p>Press <strong>any key</strong> to begin practice.</p>
        </div>
    `,
});

// Practice conditions (trials generated dynamically at runtime)
const practiceConditions = [
    { searchType: 'feature', targetPresent: true, setSize: 8 },
    { searchType: 'feature', targetPresent: false, setSize: 8 },
    { searchType: 'conjunction', targetPresent: true, setSize: 8 },
    { searchType: 'conjunction', targetPresent: false, setSize: 8 },
];

// Practice procedure - generates display at runtime using current window dimensions
const practiceProcedure = {
    timeline: [
        // Fixation cross
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div class="fixation">+</div>',
            choices: 'NO_KEYS',
            trial_duration: CONFIG.fixationDuration,
        },
        // Search display
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                const searchType = jsPsych.evaluateTimelineVariable('searchType');
                const targetPresent = jsPsych.evaluateTimelineVariable('targetPresent');
                const setSize = jsPsych.evaluateTimelineVariable('setSize');
                // Generate display with current window dimensions
                const displayWidth = window.innerWidth;
                const displayHeight = window.innerHeight;

                let display;
                if (searchType === 'feature') {
                    const featureType = Math.random() < 0.5 ? 'color' : 'orientation';
                    display = VisualSearchStimuli.generateFeatureSearchDisplay(
                        setSize,
                        targetPresent,
                        featureType,
                        displayWidth,
                        displayHeight
                    );
                } else {
                    display = VisualSearchStimuli.generateConjunctionSearchDisplay(
                        setSize,
                        targetPresent,
                        displayWidth,
                        displayHeight
                    );
                }

                // Store display info for scoring
                currentDisplayInfo = {
                    targetPresent: display.targetPresent,
                    targetPosition: display.targetPosition,
                    featureType: display.featureType,
                    itemCount: display.items.length,
                    items: display.items
                };

                return `<div class="search-container">${display.html}</div>`;
            },
            choices: [CONFIG.presentKey, CONFIG.absentKey],
            extensions: [
                {
                    type: jsPsychExtensionTobii,
                },
            ],
            data: function() {
                return {
                    task: 'visual_search',
                    search_type: jsPsych.evaluateTimelineVariable('searchType'),
                    set_size: jsPsych.evaluateTimelineVariable('setSize'),
                    is_practice: true
                };
            },
            on_load: function() {
                // Send marker when stimulus appears (use actual display info)
                jsPsych.extensions.tobii.sendMarker({
                    label: 'stimulus_onset',
                    target_present: currentDisplayInfo.targetPresent,
                    is_practice: true
                });
            },
            on_finish: function(data) {
                // Score response using actual display info
                const response = data.response;
                const targetPresent = currentDisplayInfo.targetPresent;
                const correct = (response === CONFIG.presentKey && targetPresent) ||
                               (response === CONFIG.absentKey && !targetPresent);

                // Add display info to data
                data.target_present = targetPresent;
                data.target_position = currentDisplayInfo.targetPosition;
                data.feature_type = currentDisplayInfo.featureType;
                data.item_count = currentDisplayInfo.itemCount;
                data.correct = correct;

                // Add all item positions (x, y, color, shape, isTarget)
                data.item_positions = currentDisplayInfo.items.map(item => ({
                    x: Math.round(item.x),
                    y: Math.round(item.y),
                    color: item.color,
                    shape: item.shape,
                    isTarget: item.isTarget
                }));

                // Send response marker
                jsPsych.extensions.tobii.sendMarker({
                    label: 'response',
                    response: response,
                    correct: correct,
                    rt: data.rt
                });
            }
        },
        // Feedback
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                const lastTrial = jsPsych.data.get().last(1).values()[0];
                if (lastTrial.correct) {
                    return '<div class="feedback correct">Correct!</div>';
                } else {
                    const correctAnswer = lastTrial.target_present ? 'PRESENT (P)' : 'ABSENT (A)';
                    return `<div class="feedback incorrect">Incorrect. The target was ${correctAnswer}</div>`;
                }
            },
            choices: 'NO_KEYS',
            trial_duration: CONFIG.feedbackDuration,
        }
    ],
    timeline_variables: practiceConditions,
    randomize_order: true
};

timeline.push(practiceProcedure);

// ============================================================================
// MAIN EXPERIMENT
// ============================================================================

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        const practiceData = jsPsych.data.get().filter({ is_practice: true });
        const practiceAccuracy = practiceData.select('correct').mean() * 100;

        return `
            <div class="instructions">
                <h2>Practice Complete</h2>
                <p>Your practice accuracy: <strong>${practiceAccuracy.toFixed(0)}%</strong></p>
                <hr>
                <p>Now you will begin the main experiment.</p>
                <p>There will be no feedback during the main trials.</p>
                <p>Take a short break if needed, then press <strong>any key</strong> to continue.</p>
            </div>
        `;
    },
});

// Generate all unique trial conditions
function generateAllConditions() {
    const conditions = [];
    const searchTypes = ['feature', 'conjunction'];
    const targetPresentOptions = [true, false];

    for (const searchType of searchTypes) {
        for (const setSize of CONFIG.setSizes) {
            for (const targetPresent of targetPresentOptions) {
                conditions.push({
                    searchType: searchType,
                    setSize: setSize,
                    targetPresent: targetPresent
                });
            }
        }
    }
    return conditions;
}

const allConditions = generateAllConditions();

// Single trial procedure (used within each block)
const trialProcedure = {
    timeline: [
        // Fixation cross
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div class="fixation">+</div>',
            choices: 'NO_KEYS',
            trial_duration: CONFIG.fixationDuration,
        },
        // Search display
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                const searchType = jsPsych.evaluateTimelineVariable('searchType');
                const setSize = jsPsych.evaluateTimelineVariable('setSize');
                const targetPresent = jsPsych.evaluateTimelineVariable('targetPresent');
                const display = VisualSearchStimuli.generateDisplayForTrial({
                    searchType,
                    setSize,
                    targetPresent,
                    displayWidth: window.innerWidth,
                    displayHeight: window.innerHeight
                });

                // Store display info for scoring
                currentDisplayInfo = {
                    targetPresent: display.targetPresent,
                    targetPosition: display.targetPosition,
                    featureType: display.featureType,
                    itemCount: display.items.length,
                    searchType: display.searchType,
                    items: display.items
                };

                return `<div class="search-container">${display.html}</div>`;
            },
            choices: [CONFIG.presentKey, CONFIG.absentKey],
            extensions: [
                {
                    type: jsPsychExtensionTobii,
                },
            ],
            data: function() {
                return {
                    task: 'visual_search',
                    search_type: jsPsych.evaluateTimelineVariable('searchType'),
                    set_size: jsPsych.evaluateTimelineVariable('setSize'),
                    is_practice: false
                };
            },
            on_load: function() {
                // Send marker when stimulus appears (use actual display info)
                jsPsych.extensions.tobii.sendMarker({
                    label: 'stimulus_onset',
                    search_type: currentDisplayInfo.searchType,
                    target_present: currentDisplayInfo.targetPresent,
                    is_practice: false
                });
            },
            on_finish: function(data) {
                // Score response using actual display info
                const response = data.response;
                const targetPresent = currentDisplayInfo.targetPresent;
                const correct = (response === CONFIG.presentKey && targetPresent) ||
                               (response === CONFIG.absentKey && !targetPresent);

                // Add display info to data
                data.target_present = targetPresent;
                data.target_position = currentDisplayInfo.targetPosition;
                data.feature_type = currentDisplayInfo.featureType;
                data.item_count = currentDisplayInfo.itemCount;
                data.correct = correct;

                // Add all item positions (x, y, color, shape, isTarget)
                data.item_positions = currentDisplayInfo.items.map(item => ({
                    x: Math.round(item.x),
                    y: Math.round(item.y),
                    color: item.color,
                    shape: item.shape,
                    isTarget: item.isTarget
                }));

                // Send response marker
                jsPsych.extensions.tobii.sendMarker({
                    label: 'response',
                    response: response,
                    correct: correct,
                    rt: data.rt
                });
            }
        },
        // Inter-trial interval
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '',
            choices: 'NO_KEYS',
            trial_duration: CONFIG.interTrialInterval,
        }
    ],
    timeline_variables: allConditions,
    sample: {
        type: 'fixed-repetitions',
        size: 2  // Each of 16 conditions repeated twice = 32 trials per block
    }
};

// Create block structure
for (let block = 0; block < CONFIG.numBlocks; block++) {
    // Block start message (except for first block)
    if (block > 0) {
        timeline.push({
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                const mainData = jsPsych.data.get().filter({ is_practice: false, task: 'visual_search' });
                const accuracy = mainData.select('correct').mean() * 100;

                return `
                    <div class="instructions">
                        <h2>Block ${block + 1} of ${CONFIG.numBlocks}</h2>
                        <p>Current accuracy: <strong>${accuracy.toFixed(0)}%</strong></p>
                        <hr>
                        <p>Take a short break to rest your eyes.</p>
                        <p>Press <strong>any key</strong> when you're ready to continue.</p>
                    </div>
                `;
            },
        });
    }

    // Each block samples from all conditions
    timeline.push(trialProcedure);
}

// ============================================================================
// END OF EXPERIMENT
// ============================================================================

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        const mainData = jsPsych.data.get().filter({ is_practice: false, task: 'visual_search' });
        const overallAccuracy = mainData.select('correct').mean() * 100;
        const meanRT = mainData.select('rt').mean();
        const totalTrials = mainData.count();

        return `
            <div class="instructions">
                <h2>Experiment Complete!</h2>
                <p>Thank you for participating.</p>
                <hr>
                <h3>Your Results:</h3>
                <p>Trials Completed: <strong>${totalTrials}</strong></p>
                <p>Overall Accuracy: <strong>${overallAccuracy.toFixed(1)}%</strong></p>
                <p>Mean Response Time: <strong>${meanRT.toFixed(0)} ms</strong></p>
                <hr>
                <p>Press <strong>any key</strong> to download your data and finish.</p>
            </div>
        `;
    },
});

// Exit fullscreen
timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: false
});

// ============================================================================
// RUN EXPERIMENT
// ============================================================================

jsPsych.run(timeline);
