/**
 * Calibration display component
 */

import type { CalibrationPoint, CalibrationParameters } from './types';

export class CalibrationDisplay {
  private container: HTMLElement;
  private currentPoint: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;
  private currentX: number = 0.5; // Start at center
  private currentY: number = 0.5;

  constructor(
    private displayElement: HTMLElement,
    private params: CalibrationParameters
  ) {
    this.container = this.createContainer();
    this.displayElement.appendChild(this.container);

    if (params.show_progress) {
      this.progressElement = this.createProgressIndicator();
      this.displayElement.appendChild(this.progressElement);
    }
  }

  /**
   * Create container element
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tobii-calibration-container';
    return container;
  }

  /**
   * Create progress indicator
   */
  private createProgressIndicator(): HTMLElement {
    const progress = document.createElement('div');
    progress.className = 'tobii-calibration-progress';
    return progress;
  }

  /**
   * Show instructions
   */
  async showInstructions(): Promise<void> {
    const instructions = document.createElement('div');
    instructions.className = 'tobii-calibration-instructions';
    instructions.innerHTML = `
      <div class="instructions-content">
        <h2>Eye Tracker Calibration</h2>
        <p>${this.params.instructions || 'Look at each point and follow the instructions.'}</p>
        ${
          this.params.calibration_mode === 'click'
            ? `<button class="calibration-start-btn">${this.params.button_text || 'Start Calibration'}</button>`
            : '<p>Starting in a moment...</p>'
        }
      </div>
    `;

    this.container.appendChild(instructions);

    if (this.params.calibration_mode === 'click') {
      return new Promise((resolve) => {
        const button = instructions.querySelector('button');
        button?.addEventListener('click', () => {
          instructions.remove();
          resolve();
        });
      });
    } else {
      await this.delay(3000);
      instructions.remove();
    }
  }

  /**
   * Initialize the traveling point at screen center
   */
  async initializePoint(): Promise<void> {
    if (this.currentPoint) return;

    this.currentPoint = document.createElement('div');
    this.currentPoint.className = 'tobii-calibration-point';

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
      backgroundColor: this.params.point_color || '#ff0000',
      transition: 'none',
    });

    this.container.appendChild(this.currentPoint);

    // Brief pause to show point at center before traveling
    await this.delay(300);
  }

  /**
   * Travel to the next point location with smooth animation
   */
  async travelToPoint(point: CalibrationPoint, index: number, total: number): Promise<void> {
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
    this.currentPoint!.classList.remove(
      'animation-explosion',
      'animation-shrink',
      'animation-pulse',
      'animation-zoom-out',
      'animation-zoom-in'
    );

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
    this.currentPoint.classList.remove(
      'animation-shrink',
      'animation-pulse',
      'animation-explosion',
      'animation-zoom-in'
    );
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
   * Show calibration point at specified location (legacy method for compatibility)
   */
  async showPoint(point: CalibrationPoint, index: number, total: number): Promise<void> {
    // Update progress
    if (this.progressElement) {
      this.progressElement.textContent = `Point ${index + 1} of ${total}`;
    }

    // Create point element
    this.currentPoint = document.createElement('div');
    this.currentPoint.className = 'tobii-calibration-point';

    if (this.params.animation) {
      this.currentPoint.classList.add(`animation-${this.params.animation}`);
    }

    // Convert normalized coordinates to pixels
    const x = point.x * window.innerWidth;
    const y = point.y * window.innerHeight;

    // Style the point
    Object.assign(this.currentPoint.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${this.params.point_size || 20}px`,
      height: `${this.params.point_size || 20}px`,
      backgroundColor: this.params.point_color || '#ff0000',
    });

    this.container.appendChild(this.currentPoint);

    // Small delay for point to appear
    await this.delay(100);
  }

  /**
   * Play explosion animation on the current point
   */
  async playExplosion(success: boolean): Promise<void> {
    if (!this.currentPoint) return;

    // Remove any existing animation classes
    this.currentPoint.classList.remove('animation-pulse', 'animation-shrink');

    // Add explosion animation class
    this.currentPoint.classList.add('animation-explosion');

    // Change color based on success
    if (success) {
      this.currentPoint.style.backgroundColor = '#4ade80'; // green
    } else {
      this.currentPoint.style.backgroundColor = '#f87171'; // red
    }

    // Wait for animation to complete
    await this.delay(400);
  }

  /**
   * Hide current calibration point (removes element)
   */
  async hidePoint(): Promise<void> {
    if (this.currentPoint) {
      this.currentPoint.remove();
      this.currentPoint = null;
    }
    await this.delay(200);
  }

  /**
   * Reset point state after explosion (keeps element for continued travel)
   */
  async resetPointAfterExplosion(): Promise<void> {
    if (!this.currentPoint) return;

    // Reset to normal size and opacity for next travel
    this.currentPoint.classList.remove('animation-explosion');
    this.currentPoint.style.transform = 'translate(-50%, -50%) scale(1)';
    this.currentPoint.style.opacity = '1';
    this.currentPoint.style.backgroundColor = this.params.point_color || '#ff0000';

    await this.delay(50);
  }

  /**
   * Wait for user click (in click mode)
   */
  waitForClick(): Promise<void> {
    return new Promise((resolve) => {
      const handleClick = () => {
        document.removeEventListener('click', handleClick);
        resolve();
      };
      document.addEventListener('click', handleClick);
    });
  }

  /**
   * Show calibration result
   * @param success Whether calibration succeeded
   * @param averageError Average error in degrees
   * @param canRetry Whether a retry button should be shown on failure
   * @returns 'retry' if user chose to retry, 'continue' otherwise
   */
  async showResult(
    success: boolean,
    averageError?: number,
    canRetry: boolean = false
  ): Promise<'retry' | 'continue'> {
    const result = document.createElement('div');
    result.className = 'tobii-calibration-result';

    if (success) {
      result.innerHTML = `
        <div class="result-content success">
          <h2>Calibration Successful!</h2>
          ${averageError != null ? `<p>Average error: ${averageError.toFixed(2)}°</p>` : ''}
          <p>Continuing automatically...</p>
        </div>
      `;

      this.container.appendChild(result);

      // Auto-advance after showing result
      await this.delay(2000);
      result.remove();
      return 'continue';
    }

    // Failure case: show buttons
    const buttonsHTML = canRetry
      ? `<button class="calibration-retry-btn">Retry</button>
         <button class="calibration-continue-btn" style="margin-left: 10px;">Continue</button>`
      : `<button class="calibration-continue-btn">Continue</button>`;

    result.innerHTML = `
      <div class="result-content error">
        <h2>Calibration Failed</h2>
        ${averageError != null ? `<p>Average error: ${averageError.toFixed(2)}°</p>` : ''}
        <p>Please try again or continue.</p>
        ${buttonsHTML}
      </div>
    `;

    this.container.appendChild(result);

    return new Promise((resolve) => {
      const retryBtn = result.querySelector('.calibration-retry-btn');
      const continueBtn = result.querySelector('.calibration-continue-btn');

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

  /**
   * Clear display
   */
  clear(): void {
    this.container.innerHTML = '';
    if (this.progressElement) {
      this.progressElement.textContent = '';
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
