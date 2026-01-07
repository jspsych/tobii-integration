/**
 * Validation display component
 */

import type { ValidationPoint, ValidationParameters, PointValidationData } from "./types";

export class ValidationDisplay {
  private container: HTMLElement;
  private currentPoint: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;

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
    const container = document.createElement("div");
    container.className = "tobii-validation-container";
    return container;
  }

  private createProgressIndicator(): HTMLElement {
    const progress = document.createElement("div");
    progress.className = "tobii-validation-progress";
    return progress;
  }

  async showInstructions(): Promise<void> {
    const instructions = document.createElement("div");
    instructions.className = "tobii-validation-instructions";
    instructions.innerHTML = `
      <div class="instructions-content">
        <h2>Eye Tracker Validation</h2>
        <p>${this.params.instructions || "Look at each point to validate calibration accuracy."}</p>
        <button class="validation-start-btn">Start Validation</button>
      </div>
    `;

    this.container.appendChild(instructions);

    return new Promise((resolve) => {
      const button = instructions.querySelector("button");
      button?.addEventListener("click", () => {
        instructions.remove();
        resolve();
      });
    });
  }

  async showPoint(point: ValidationPoint, index: number, total: number): Promise<void> {
    if (this.progressElement) {
      this.progressElement.textContent = `Point ${index + 1} of ${total}`;
    }

    this.currentPoint = document.createElement("div");
    this.currentPoint.className = "tobii-validation-point";

    const x = point.x * window.innerWidth;
    const y = point.y * window.innerHeight;

    Object.assign(this.currentPoint.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${this.params.point_size || 20}px`,
      height: `${this.params.point_size || 20}px`,
      backgroundColor: this.params.point_color || "#00ff00",
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

  async showResult(
    success: boolean,
    averageAccuracy?: number,
    averagePrecision?: number,
    pointData?: PointValidationData[]
  ): Promise<void> {
    const result = document.createElement("div");
    result.className = "tobii-validation-result";

    if (success) {
      let feedbackHTML = "";

      if (this.params.show_feedback && pointData) {
        feedbackHTML = this.createVisualFeedback(pointData);
      }

      result.innerHTML = `
        <div class="result-content success">
          <h2>Validation Complete</h2>
          ${averageAccuracy !== undefined ? `<p>Average accuracy: ${averageAccuracy.toFixed(2)}°</p>` : ""}
          ${averagePrecision !== undefined ? `<p>Average precision: ${averagePrecision.toFixed(2)}°</p>` : ""}
          ${feedbackHTML}
          <button class="validation-continue-btn">Continue</button>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="result-content error">
          <h2>Validation Failed</h2>
          <p>Please recalibrate.</p>
          <button class="validation-retry-btn">Retry</button>
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

  private createVisualFeedback(pointData: PointValidationData[]): string {
    const goodColor = (this.params as any).accuracy_good_color || "#00ff00";
    const fairColor = (this.params as any).accuracy_fair_color || "#ffff00";
    const poorColor = (this.params as any).accuracy_poor_color || "#ff0000";

    const canvas = `
      <div class="validation-feedback">
        <h3>Accuracy Map</h3>
        <div class="feedback-canvas">
          ${pointData
            .map((data) => {
              const x = data.point.x * 100;
              const y = data.point.y * 100;
              const color = this.getAccuracyColor(data.accuracy);
              return `
                <div class="feedback-point" style="
                  left: ${x}%;
                  top: ${y}%;
                  background-color: ${color};
                " title="Accuracy: ${data.accuracy.toFixed(2)}°">
                </div>
              `;
            })
            .join("")}
        </div>
        <div class="feedback-legend">
          <span><span class="legend-color" style="background-color: ${goodColor};"></span> Good (&lt;1°)</span>
          <span><span class="legend-color" style="background-color: ${fairColor};"></span> Fair (1-2°)</span>
          <span><span class="legend-color" style="background-color: ${poorColor};"></span> Poor (&gt;2°)</span>
        </div>
      </div>
    `;
    return canvas;
  }

  private getAccuracyColor(accuracy: number): string {
    const goodColor = (this.params as any).accuracy_good_color || "#00ff00";
    const fairColor = (this.params as any).accuracy_fair_color || "#ffff00";
    const poorColor = (this.params as any).accuracy_poor_color || "#ff0000";

    if (accuracy < 1.0) return goodColor;
    if (accuracy < 2.0) return fairColor;
    return poorColor;
  }

  clear(): void {
    this.container.innerHTML = "";
    if (this.progressElement) {
      this.progressElement.textContent = "";
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
