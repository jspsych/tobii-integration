/**
 * Calibration display component
 */

import type { CalibrationPoint, CalibrationParameters } from "./types";

export class CalibrationDisplay {
  private container: HTMLElement;
  private currentPoint: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;

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
    const container = document.createElement("div");
    container.className = "tobii-calibration-container";
    return container;
  }

  /**
   * Create progress indicator
   */
  private createProgressIndicator(): HTMLElement {
    const progress = document.createElement("div");
    progress.className = "tobii-calibration-progress";
    return progress;
  }

  /**
   * Show instructions
   */
  async showInstructions(): Promise<void> {
    const instructions = document.createElement("div");
    instructions.className = "tobii-calibration-instructions";
    instructions.innerHTML = `
      <div class="instructions-content">
        <h2>Eye Tracker Calibration</h2>
        <p>${this.params.instructions || "Look at each point and follow the instructions."}</p>
        ${
          this.params.calibration_mode === "click"
            ? `<button class="calibration-start-btn">${this.params.button_text || "Start Calibration"}</button>`
            : "<p>Calibration will start automatically...</p>"
        }
      </div>
    `;

    this.container.appendChild(instructions);

    if (this.params.calibration_mode === "click") {
      return new Promise((resolve) => {
        const button = instructions.querySelector("button");
        button?.addEventListener("click", () => {
          instructions.remove();
          resolve();
        });
      });
    } else {
      await this.delay(2000);
      instructions.remove();
    }
  }

  /**
   * Show calibration point at specified location
   */
  async showPoint(point: CalibrationPoint, index: number, total: number): Promise<void> {
    // Update progress
    if (this.progressElement) {
      this.progressElement.textContent = `Point ${index + 1} of ${total}`;
    }

    // Create point element
    this.currentPoint = document.createElement("div");
    this.currentPoint.className = "tobii-calibration-point";

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
      backgroundColor: this.params.point_color || "#ff0000",
    });

    this.container.appendChild(this.currentPoint);

    // Small delay for point to appear
    await this.delay(100);
  }

  /**
   * Hide current calibration point
   */
  async hidePoint(): Promise<void> {
    if (this.currentPoint) {
      this.currentPoint.remove();
      this.currentPoint = null;
    }
    await this.delay(200);
  }

  /**
   * Wait for user click (in click mode)
   */
  waitForClick(): Promise<void> {
    return new Promise((resolve) => {
      const handleClick = () => {
        document.removeEventListener("click", handleClick);
        resolve();
      };
      document.addEventListener("click", handleClick);
    });
  }

  /**
   * Show calibration result
   */
  async showResult(success: boolean, averageError?: number): Promise<void> {
    const result = document.createElement("div");
    result.className = "tobii-calibration-result";

    if (success) {
      result.innerHTML = `
        <div class="result-content success">
          <h2>Calibration Successful!</h2>
          ${averageError !== undefined ? `<p>Average error: ${averageError.toFixed(2)}°</p>` : ""}
          <button class="calibration-continue-btn">Continue</button>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="result-content error">
          <h2>Calibration Failed</h2>
          <p>Please try again.</p>
          <button class="calibration-retry-btn">Retry</button>
        </div>
      `;
    }

    this.container.appendChild(result);

    return new Promise((resolve) => {
      const button = result.querySelector("button");
      button?.addEventListener("click", () => {
        result.remove();
        resolve();
      });
    });
  }

  /**
   * Clear display
   */
  clear(): void {
    this.container.innerHTML = "";
    if (this.progressElement) {
      this.progressElement.textContent = "";
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
