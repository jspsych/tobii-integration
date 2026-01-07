import { UserPositionData, PositionQuality } from './types';

export interface PositionDisplayOptions {
  message: string;
  showDistanceFeedback: boolean;
  showPositionFeedback: boolean;
  backgroundColor: string;
  goodColor: string;
  fairColor: string;
  poorColor: string;
  fontSize: string;
}

/**
 * Display component for user position guide
 */
export class PositionDisplay {
  private container: HTMLElement;
  private messageElement: HTMLElement;
  private positionBoxElement: HTMLElement;
  private leftIndicatorElement: HTMLElement;
  private rightIndicatorElement: HTMLElement;
  private distanceElement: HTMLElement;
  private feedbackElement: HTMLElement;
  private options: PositionDisplayOptions;

  constructor(container: HTMLElement, options: PositionDisplayOptions) {
    this.container = container;
    this.options = options;
    this.createDisplay();
  }

  private createDisplay(): void {
    this.container.innerHTML = '';

    // Message
    this.messageElement = document.createElement('div');
    this.messageElement.className = 'tobii-user-position-message';
    this.messageElement.textContent = this.options.message;
    this.container.appendChild(this.messageElement);

    // Position guide container
    const guideContainer = document.createElement('div');
    guideContainer.className = 'tobii-user-position-guide';
    this.container.appendChild(guideContainer);

    // Position box (represents the optimal tracking zone)
    this.positionBoxElement = document.createElement('div');
    this.positionBoxElement.className = 'tobii-position-box';
    guideContainer.appendChild(this.positionBoxElement);

    // Left eye indicator
    if (this.options.showPositionFeedback) {
      this.leftIndicatorElement = document.createElement('div');
      this.leftIndicatorElement.className = 'tobii-eye-indicator tobii-left-eye';
      this.positionBoxElement.appendChild(this.leftIndicatorElement);

      // Right eye indicator
      this.rightIndicatorElement = document.createElement('div');
      this.rightIndicatorElement.className = 'tobii-eye-indicator tobii-right-eye';
      this.positionBoxElement.appendChild(this.rightIndicatorElement);
    }

    // Distance feedback
    if (this.options.showDistanceFeedback) {
      this.distanceElement = document.createElement('div');
      this.distanceElement.className = 'tobii-distance-feedback';
      guideContainer.appendChild(this.distanceElement);
    }

    // Textual feedback
    this.feedbackElement = document.createElement('div');
    this.feedbackElement.className = 'tobii-position-feedback';
    this.container.appendChild(this.feedbackElement);
  }

  /**
   * Update the display with new position data
   */
  public updatePosition(positionData: UserPositionData): void {
    if (!positionData) {
      this.showNoData();
      return;
    }

    // Calculate average position from both eyes
    const avgX = this.getAveragePosition(positionData.leftX, positionData.rightX, positionData.leftValid, positionData.rightValid);
    const avgY = this.getAveragePosition(positionData.leftY, positionData.rightY, positionData.leftValid, positionData.rightValid);
    const avgZ = this.getAveragePosition(positionData.leftZ, positionData.rightZ, positionData.leftValid, positionData.rightValid);

    // Update position indicators
    if (this.options.showPositionFeedback) {
      this.updateEyeIndicator(this.leftIndicatorElement, positionData.leftX, positionData.leftY, positionData.leftValid);
      this.updateEyeIndicator(this.rightIndicatorElement, positionData.rightX, positionData.rightY, positionData.rightValid);
    }

    // Update distance feedback
    if (this.options.showDistanceFeedback && avgZ !== null) {
      this.updateDistanceFeedback(avgZ);
    }

    // Update textual feedback
    this.updateTextualFeedback(avgX, avgY, avgZ);
  }

  private getAveragePosition(left: number | null, right: number | null, leftValid: boolean, rightValid: boolean): number | null {
    if (leftValid && rightValid && left !== null && right !== null) {
      return (left + right) / 2;
    } else if (leftValid && left !== null) {
      return left;
    } else if (rightValid && right !== null) {
      return right;
    }
    return null;
  }

  private updateEyeIndicator(element: HTMLElement, x: number | null, y: number | null, valid: boolean): void {
    if (!element) return;

    if (!valid || x === null || y === null) {
      element.style.display = 'none';
      return;
    }

    element.style.display = 'block';

    // Position indicator (x and y are 0-1, where 0.5 is center)
    // Convert to percentage within the box
    const boxWidth = this.positionBoxElement.offsetWidth;
    const boxHeight = this.positionBoxElement.offsetHeight;

    const pixelX = x * boxWidth;
    const pixelY = y * boxHeight;

    element.style.left = `${pixelX}px`;
    element.style.top = `${pixelY}px`;

    // Color based on position quality
    const color = this.getPositionColor(x, y);
    element.style.backgroundColor = color;
    element.style.borderColor = color;
  }

  private updateDistanceFeedback(z: number): void {
    if (!this.distanceElement) return;

    let feedback: string;
    let color: string;

    if (z < 0.3) {
      feedback = 'Too close - Move back';
      color = this.options.poorColor;
    } else if (z > 0.7) {
      feedback = 'Too far - Move forward';
      color = this.options.poorColor;
    } else if (z < 0.4 || z > 0.6) {
      feedback = 'Distance: Fair';
      color = this.options.fairColor;
    } else {
      feedback = 'Distance: Good';
      color = this.options.goodColor;
    }

    this.distanceElement.textContent = feedback;
    this.distanceElement.style.color = color;
  }

  private updateTextualFeedback(x: number | null, y: number | null, z: number | null): void {
    if (!this.feedbackElement) return;

    if (x === null || y === null || z === null) {
      this.feedbackElement.textContent = 'No position data available';
      this.feedbackElement.style.color = this.options.poorColor;
      return;
    }

    const quality = this.assessPositionQuality(x, y, z);

    let feedback: string;
    let color: string;

    if (quality.isGoodPosition) {
      feedback = 'Position: Good';
      color = this.options.goodColor;
    } else {
      const issues: string[] = [];
      if (quality.horizontalStatus === 'poor') issues.push('center horizontally');
      else if (quality.horizontalStatus === 'fair') issues.push('adjust horizontal position');

      if (quality.verticalStatus === 'poor') issues.push('center vertically');
      else if (quality.verticalStatus === 'fair') issues.push('adjust vertical position');

      if (quality.distanceStatus === 'poor') issues.push(z < 0.5 ? 'move back' : 'move forward');
      else if (quality.distanceStatus === 'fair') issues.push('adjust distance');

      feedback = issues.length > 0 ? `Adjust: ${issues.join(', ')}` : 'Position: Fair';
      color = quality.distanceStatus === 'poor' || quality.horizontalStatus === 'poor' || quality.verticalStatus === 'poor'
        ? this.options.poorColor
        : this.options.fairColor;
    }

    this.feedbackElement.textContent = feedback;
    this.feedbackElement.style.color = color;
  }

  private getPositionColor(x: number, y: number): string {
    // Calculate distance from center (0.5, 0.5)
    const dx = x - 0.5;
    const dy = y - 0.5;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.15) return this.options.goodColor;
    if (distance < 0.25) return this.options.fairColor;
    return this.options.poorColor;
  }

  private assessPositionQuality(x: number, y: number, z: number): PositionQuality {
    // Assess horizontal position
    const xOffset = Math.abs(x - 0.5);
    let horizontalStatus: 'good' | 'fair' | 'poor';
    if (xOffset < 0.15) horizontalStatus = 'good';
    else if (xOffset < 0.25) horizontalStatus = 'fair';
    else horizontalStatus = 'poor';

    // Assess vertical position
    const yOffset = Math.abs(y - 0.5);
    let verticalStatus: 'good' | 'fair' | 'poor';
    if (yOffset < 0.15) verticalStatus = 'good';
    else if (yOffset < 0.25) verticalStatus = 'fair';
    else verticalStatus = 'poor';

    // Assess distance
    const zOffset = Math.abs(z - 0.5);
    let distanceStatus: 'good' | 'fair' | 'poor';
    if (zOffset < 0.1) distanceStatus = 'good';
    else if (zOffset < 0.2) distanceStatus = 'fair';
    else distanceStatus = 'poor';

    const isGoodPosition = horizontalStatus === 'good' && verticalStatus === 'good' && distanceStatus === 'good';

    return {
      isGoodPosition,
      horizontalStatus,
      verticalStatus,
      distanceStatus,
      averageX: x,
      averageY: y,
      averageZ: z,
    };
  }

  private showNoData(): void {
    if (this.feedbackElement) {
      this.feedbackElement.textContent = 'No position data available';
      this.feedbackElement.style.color = this.options.poorColor;
    }
    if (this.leftIndicatorElement) this.leftIndicatorElement.style.display = 'none';
    if (this.rightIndicatorElement) this.rightIndicatorElement.style.display = 'none';
  }

  /**
   * Get current position quality
   */
  public getCurrentQuality(positionData: UserPositionData): PositionQuality {
    if (!positionData) {
      return {
        isGoodPosition: false,
        horizontalStatus: 'poor',
        verticalStatus: 'poor',
        distanceStatus: 'poor',
        averageX: null,
        averageY: null,
        averageZ: null,
      };
    }

    const avgX = this.getAveragePosition(positionData.leftX, positionData.rightX, positionData.leftValid, positionData.rightValid);
    const avgY = this.getAveragePosition(positionData.leftY, positionData.rightY, positionData.leftValid, positionData.rightValid);
    const avgZ = this.getAveragePosition(positionData.leftZ, positionData.rightZ, positionData.leftValid, positionData.rightValid);

    if (avgX === null || avgY === null || avgZ === null) {
      return {
        isGoodPosition: false,
        horizontalStatus: 'poor',
        verticalStatus: 'poor',
        distanceStatus: 'poor',
        averageX,
        averageY,
        averageZ,
      };
    }

    return this.assessPositionQuality(avgX, avgY, avgZ);
  }

  /**
   * Remove the display
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}
