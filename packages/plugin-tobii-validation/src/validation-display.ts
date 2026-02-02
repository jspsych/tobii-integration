/**
 * Validation display component
 */

import type { ValidationPoint, ValidationParameters, PointValidationData } from './types';

export class ValidationDisplay {
  private container: HTMLElement;
  private currentPoint: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;
  private currentX: number = 0.5; // Start at center
  private currentY: number = 0.5;

  constructor(
    private displayElement: HTMLElement,
    private params: ValidationParameters
  ) {
    this.container = this.createContainer();
    this.displayElement.appendChild(this.container);

    if (params.show_progress) {
      this.progressElement = this.createProgressIndicator();
      this.displayElement.appendChild(this.progressElement);
    }
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tobii-validation-container';
    return container;
  }

  private createProgressIndicator(): HTMLElement {
    const progress = document.createElement('div');
    progress.className = 'tobii-validation-progress';
    return progress;
  }

  async showInstructions(): Promise<void> {
    const instructions = document.createElement('div');
    instructions.className = 'tobii-validation-instructions';
    instructions.innerHTML = `
      <div class="instructions-content">
        <h2>Eye Tracker Validation</h2>
        <p>${this.params.instructions || 'Look at each point to validate calibration accuracy.'}</p>
        <button class="validation-start-btn">Start Validation</button>
      </div>
    `;

    this.container.appendChild(instructions);

    return new Promise((resolve) => {
      const button = instructions.querySelector('button');
      button?.addEventListener('click', () => {
        instructions.remove();
        resolve();
      });
    });
  }

  /**
   * Initialize the traveling point at screen center
   */
  async initializePoint(): Promise<void> {
    if (this.currentPoint) return;

    this.currentPoint = document.createElement('div');
    this.currentPoint.className = 'tobii-validation-point';

    // Start at center
    const x = 0.5 * window.innerWidth;
    const y = 0.5 * window.innerHeight;
    this.currentX = 0.5;
    this.currentY = 0.5;

    Object.assign(this.currentPoint.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${this.params.point_size || 20}px`,
      height: `${this.params.point_size || 20}px`,
      backgroundColor: this.params.point_color || '#00ff00',
      transition: 'none',
    });

    this.container.appendChild(this.currentPoint);

    // Brief pause to show point at center before traveling
    await this.delay(300);
  }

  /**
   * Travel to the next point location with smooth animation
   */
  async travelToPoint(point: ValidationPoint, index: number, total: number): Promise<void> {
    if (!this.currentPoint) {
      await this.initializePoint();
    }

    // Update progress
    if (this.progressElement) {
      this.progressElement.textContent = `Point ${index + 1} of ${total}`;
    }

    // Calculate travel distance for dynamic duration
    const dx = point.x - this.currentX;
    const dy = point.y - this.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Travel duration: 150ms base + 200ms per normalized unit distance (quick travel)
    const travelDuration = Math.max(150, Math.min(400, 150 + distance * 200));

    // Convert normalized coordinates to pixels
    const x = point.x * window.innerWidth;
    const y = point.y * window.innerHeight;

    // Set up travel transition
    this.currentPoint!.style.transition = `left ${travelDuration}ms ease-in-out, top ${travelDuration}ms ease-in-out`;
    this.currentPoint!.classList.remove('animation-zoom-out', 'animation-zoom-in');

    // Move to new position
    this.currentPoint!.style.left = `${x}px`;
    this.currentPoint!.style.top = `${y}px`;

    // Update current position
    this.currentX = point.x;
    this.currentY = point.y;

    // Wait for travel to complete
    await this.delay(travelDuration);
  }

  /**
   * Play zoom out animation (point grows larger)
   */
  async playZoomOut(): Promise<void> {
    if (!this.currentPoint) return;

    this.currentPoint.style.transition = 'none';
    this.currentPoint.classList.remove('animation-zoom-in');
    this.currentPoint.classList.add('animation-zoom-out');

    await this.delay(300);
  }

  /**
   * Play zoom in animation (point shrinks to fixation size)
   */
  async playZoomIn(): Promise<void> {
    if (!this.currentPoint) return;

    this.currentPoint.classList.remove('animation-zoom-out');
    this.currentPoint.classList.add('animation-zoom-in');

    await this.delay(300);
  }

  /**
   * Reset point state after data collection (keeps element for continued travel)
   */
  async resetPointForTravel(): Promise<void> {
    if (!this.currentPoint) return;

    // Reset to normal size for next travel
    this.currentPoint.classList.remove('animation-zoom-out', 'animation-zoom-in');
    this.currentPoint.style.transform = 'translate(-50%, -50%) scale(1)';

    await this.delay(50);
  }

  async showPoint(point: ValidationPoint, index: number, total: number): Promise<void> {
    if (this.progressElement) {
      this.progressElement.textContent = `Point ${index + 1} of ${total}`;
    }

    this.currentPoint = document.createElement('div');
    this.currentPoint.className = 'tobii-validation-point';

    const x = point.x * window.innerWidth;
    const y = point.y * window.innerHeight;

    Object.assign(this.currentPoint.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${this.params.point_size || 20}px`,
      height: `${this.params.point_size || 20}px`,
      backgroundColor: this.params.point_color || '#00ff00',
    });

    this.container.appendChild(this.currentPoint);
    await this.delay(100);
  }

  async hidePoint(): Promise<void> {
    if (this.currentPoint) {
      this.currentPoint.remove();
      this.currentPoint = null;
    }
    await this.delay(200);
  }

  /**
   * Show validation result
   * @param success Whether validation passed
   * @param averageAccuracyNorm Average accuracy in normalized units
   * @param averagePrecisionNorm Average precision in normalized units
   * @param pointData Per-point validation data
   * @param tolerance Tolerance threshold
   * @param canRetry Whether a retry button should be shown on failure
   * @returns 'retry' if user chose to retry, 'continue' otherwise
   */
  async showResult(
    success: boolean,
    averageAccuracyNorm?: number,
    averagePrecisionNorm?: number,
    pointData?: PointValidationData[],
    tolerance?: number,
    canRetry: boolean = false
  ): Promise<'retry' | 'continue'> {
    const result = document.createElement('div');
    result.className = 'tobii-validation-result';

    let feedbackHTML = '';
    if (this.params.show_feedback && pointData) {
      feedbackHTML = this.createVisualFeedback(pointData, tolerance);
    }

    const statusClass = success ? 'success' : 'error';
    const statusText = success ? 'Validation Passed' : 'Validation Failed';

    let buttonsHTML: string;
    if (success) {
      buttonsHTML = `<button class="validation-continue-btn">Continue</button>`;
    } else if (canRetry) {
      buttonsHTML = `<button class="validation-retry-btn">Retry</button>
        <button class="validation-continue-btn" style="margin-left: 10px;">Continue</button>`;
    } else {
      buttonsHTML = `<button class="validation-continue-btn">Continue</button>`;
    }

    result.innerHTML = `
      <div class="result-content ${statusClass}">
        <h2>${statusText}</h2>
        <p>Average error: ${((averageAccuracyNorm || 0) * 100).toFixed(1)}% (tolerance: ${((tolerance || 0) * 100).toFixed(0)}%)</p>
        ${feedbackHTML}
        ${buttonsHTML}
      </div>
    `;

    this.container.appendChild(result);

    return new Promise((resolve) => {
      const retryBtn = result.querySelector('.validation-retry-btn');
      const continueBtn = result.querySelector('.validation-continue-btn');

      retryBtn?.addEventListener('click', () => {
        result.remove();
        resolve('retry');
      });

      continueBtn?.addEventListener('click', () => {
        result.remove();
        resolve('continue');
      });
    });
  }

  /**
   * Reset display state for a retry attempt
   */
  resetForRetry(): void {
    this.container.innerHTML = '';
    this.currentPoint = null;
    this.currentX = 0.5;
    this.currentY = 0.5;
  }

  private createVisualFeedback(pointData: PointValidationData[], tolerance?: number): string {
    const tol = tolerance || 0.05;

    // Create full-screen visualization showing actual screen positions
    const targetMarkers = pointData
      .map((data, idx) => {
        const x = data.point.x * 100;
        const y = data.point.y * 100;
        return `
        <div class="feedback-target" style="
          left: ${x}%;
          top: ${y}%;
        " title="Target ${idx + 1}">
          <span class="target-label">${idx + 1}</span>
        </div>
      `;
      })
      .join('');

    // Mean gaze positions - color coded based on tolerance
    const gazeMarkers = pointData
      .map((data, idx) => {
        if (!data.meanGaze) return '';
        const x = data.meanGaze.x * 100;
        const y = data.meanGaze.y * 100;
        const withinTolerance = data.accuracyNorm <= tol;
        const colorClass = withinTolerance ? 'gaze-pass' : 'gaze-fail';
        return `
        <div class="feedback-gaze ${colorClass}" style="
          left: ${x}%;
          top: ${y}%;
        " title="Error: ${(data.accuracyNorm * 100).toFixed(1)}%">
          <span class="gaze-label">${idx + 1}</span>
        </div>
      `;
      })
      .join('');

    // Draw lines connecting targets to mean gaze positions - color coded
    const connectionLines = pointData
      .map((data) => {
        if (!data.meanGaze) return '';
        const x1 = data.point.x * 100;
        const y1 = data.point.y * 100;
        const x2 = data.meanGaze.x * 100;
        const y2 = data.meanGaze.y * 100;
        const withinTolerance = data.accuracyNorm <= tol;
        const lineColor = withinTolerance ? '#4ade80' : '#f87171';
        return `
        <svg class="feedback-line" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;">
          <line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"
                stroke="${lineColor}" stroke-width="2" stroke-dasharray="5,3" opacity="0.7"/>
        </svg>
      `;
      })
      .join('');

    // Show all individual gaze samples as small dots - color coded per point
    const gazeSampleDots = pointData
      .map((data) => {
        if (!data.gazeSamples) return '';
        const withinTolerance = data.accuracyNorm <= tol;
        const sampleClass = withinTolerance ? 'sample-pass' : 'sample-fail';
        return data.gazeSamples
          .map((sample) => {
            const x = sample.x * 100;
            const y = sample.y * 100;
            return `<div class="feedback-sample ${sampleClass}" style="left: ${x}%; top: ${y}%;"></div>`;
          })
          .join('');
      })
      .join('');

    // Calculate aspect ratio from viewport
    const aspectRatio = window.innerWidth / window.innerHeight;

    const canvas = `
      <div class="validation-feedback">
        <div class="feedback-canvas-fullscreen" style="aspect-ratio: ${aspectRatio.toFixed(3)};">
          ${connectionLines}
          ${gazeSampleDots}
          ${targetMarkers}
          ${gazeMarkers}
        </div>
        <div class="feedback-legend">
          <span><span class="legend-color target-legend"></span> Target</span>
          <span><span class="legend-color gaze-pass-legend"></span> Pass</span>
          <span><span class="legend-color gaze-fail-legend"></span> Fail</span>
        </div>
      </div>
    `;
    return canvas;
  }

  clear(): void {
    this.container.innerHTML = '';
    if (this.progressElement) {
      this.progressElement.textContent = '';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
