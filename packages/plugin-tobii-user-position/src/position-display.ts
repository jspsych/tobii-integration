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
  positionThresholdGood: number;
  positionThresholdFair: number;
  distanceThresholdGood: number;
  distanceThresholdFair: number;
}

/**
 * Display component for user position guide
 * Shows a face outline that scales with distance, similar to Tobii Eye Tracker Manager
 */
export class PositionDisplay {
  private container: HTMLElement;
  private messageElement!: HTMLElement;
  private trackingBoxElement!: HTMLElement;
  private faceOutlineElement!: HTMLElement;
  private leftEyeElement!: HTMLElement;
  private rightEyeElement!: HTMLElement;
  private distanceBarContainer!: HTMLElement;
  private distanceBarFill!: HTMLElement;
  private feedbackElement!: HTMLElement;
  private options: PositionDisplayOptions;

  // Constants for the display
  private readonly BOX_WIDTH = 400;
  private readonly BOX_HEIGHT = 300;
  private readonly MIN_FACE_SCALE = 0.4; // Scale when far away
  private readonly MAX_FACE_SCALE = 1.6; // Scale when too close
  private readonly OPTIMAL_FACE_SCALE = 1.0; // Scale at optimal distance

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

    // Tracking box (represents the optimal tracking zone)
    this.trackingBoxElement = document.createElement('div');
    this.trackingBoxElement.className = 'tobii-tracking-box';
    this.trackingBoxElement.style.cssText = `
      position: relative;
      width: ${this.BOX_WIDTH}px;
      height: ${this.BOX_HEIGHT}px;
      border: 3px solid #666;
      border-radius: 12px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      overflow: hidden;
      box-shadow: inset 0 0 30px rgba(0,0,0,0.5);
    `;
    guideContainer.appendChild(this.trackingBoxElement);

    // Optimal zone indicator (center rectangle)
    const optimalZone = document.createElement('div');
    optimalZone.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60%;
      height: 70%;
      border: 2px dashed rgba(255,255,255,0.2);
      border-radius: 8px;
    `;
    this.trackingBoxElement.appendChild(optimalZone);

    // Face outline container (this moves and scales)
    this.faceOutlineElement = document.createElement('div');
    this.faceOutlineElement.className = 'tobii-face-outline';
    this.faceOutlineElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease-out;
    `;
    this.trackingBoxElement.appendChild(this.faceOutlineElement);

    // Create face SVG
    this.createFaceSVG();

    // Distance bar (vertical bar on the side)
    if (this.options.showDistanceFeedback) {
      this.distanceBarContainer = document.createElement('div');
      this.distanceBarContainer.style.cssText = `
        position: absolute;
        right: -40px;
        top: 10%;
        width: 20px;
        height: 80%;
        background: rgba(0,0,0,0.3);
        border-radius: 10px;
        border: 2px solid #444;
        overflow: hidden;
      `;
      guideContainer.appendChild(this.distanceBarContainer);

      // Distance labels
      const closeLabel = document.createElement('div');
      closeLabel.textContent = 'Close';
      closeLabel.style.cssText = `
        position: absolute;
        right: -70px;
        top: 0;
        font-size: 10px;
        color: #888;
      `;
      guideContainer.appendChild(closeLabel);

      const farLabel = document.createElement('div');
      farLabel.textContent = 'Far';
      farLabel.style.cssText = `
        position: absolute;
        right: -55px;
        bottom: 10%;
        font-size: 10px;
        color: #888;
      `;
      guideContainer.appendChild(farLabel);

      this.distanceBarFill = document.createElement('div');
      this.distanceBarFill.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50%;
        background: ${this.options.goodColor};
        border-radius: 8px;
        transition: all 0.1s ease-out;
      `;
      this.distanceBarContainer.appendChild(this.distanceBarFill);

      // Optimal zone marker on distance bar
      const optimalMarker = document.createElement('div');
      optimalMarker.style.cssText = `
        position: absolute;
        left: -2px;
        right: -2px;
        top: 40%;
        height: 20%;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 4px;
        pointer-events: none;
      `;
      this.distanceBarContainer.appendChild(optimalMarker);
    }

    // Textual feedback
    this.feedbackElement = document.createElement('div');
    this.feedbackElement.className = 'tobii-position-feedback';
    this.feedbackElement.style.cssText = `
      margin-top: 20px;
      font-size: 1.1em;
      font-weight: 600;
      text-align: center;
    `;
    this.container.appendChild(this.feedbackElement);
  }

  private createFaceSVG(): void {
    // Base size for the face
    const baseWidth = 120;
    const baseHeight = 150;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${baseWidth}`);
    svg.setAttribute('height', `${baseHeight}`);
    svg.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
    svg.style.cssText = 'overflow: visible;';

    // Face outline (oval)
    const faceOutline = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    faceOutline.setAttribute('cx', '60');
    faceOutline.setAttribute('cy', '80');
    faceOutline.setAttribute('rx', '50');
    faceOutline.setAttribute('ry', '65');
    faceOutline.setAttribute('fill', 'none');
    faceOutline.setAttribute('stroke', '#888');
    faceOutline.setAttribute('stroke-width', '3');
    faceOutline.setAttribute('stroke-dasharray', '8,4');
    svg.appendChild(faceOutline);

    // Left eye socket
    this.leftEyeElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    ) as unknown as HTMLElement;
    this.leftEyeElement.setAttribute('cx', '40');
    this.leftEyeElement.setAttribute('cy', '65');
    this.leftEyeElement.setAttribute('r', '12');
    this.leftEyeElement.setAttribute('fill', this.options.poorColor);
    this.leftEyeElement.setAttribute('stroke', '#fff');
    this.leftEyeElement.setAttribute('stroke-width', '2');
    svg.appendChild(this.leftEyeElement as unknown as SVGElement);

    // Right eye socket
    this.rightEyeElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    ) as unknown as HTMLElement;
    this.rightEyeElement.setAttribute('cx', '80');
    this.rightEyeElement.setAttribute('cy', '65');
    this.rightEyeElement.setAttribute('r', '12');
    this.rightEyeElement.setAttribute('fill', this.options.poorColor);
    this.rightEyeElement.setAttribute('stroke', '#fff');
    this.rightEyeElement.setAttribute('stroke-width', '2');
    svg.appendChild(this.rightEyeElement as unknown as SVGElement);

    // Nose hint
    const nose = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    nose.setAttribute('d', 'M60,75 L55,95 L65,95 Z');
    nose.setAttribute('fill', 'none');
    nose.setAttribute('stroke', '#666');
    nose.setAttribute('stroke-width', '2');
    svg.appendChild(nose);

    this.faceOutlineElement.appendChild(svg);
  }

  /**
   * Update the display with new position data
   */
  public updatePosition(positionData: UserPositionData | null): void {
    if (!positionData) {
      this.showNoData();
      return;
    }

    // Calculate average position from both eyes
    const avgX = this.getAveragePosition(
      positionData.leftX,
      positionData.rightX,
      positionData.leftValid,
      positionData.rightValid
    );
    const avgY = this.getAveragePosition(
      positionData.leftY,
      positionData.rightY,
      positionData.leftValid,
      positionData.rightValid
    );
    const avgZ = this.getAveragePosition(
      positionData.leftZ,
      positionData.rightZ,
      positionData.leftValid,
      positionData.rightValid
    );

    // Update face position and scale
    this.updateFaceDisplay(avgX, avgY, avgZ, positionData);

    // Update distance bar
    if (this.options.showDistanceFeedback && avgZ !== null) {
      this.updateDistanceBar(avgZ);
    }

    // Update eye indicators
    this.updateEyeIndicators(positionData);

    // Update textual feedback
    this.updateTextualFeedback(avgX, avgY, avgZ);
  }

  private getAveragePosition(
    left: number | null,
    right: number | null,
    leftValid: boolean,
    rightValid: boolean
  ): number | null {
    if (leftValid && rightValid && left !== null && right !== null) {
      return (left + right) / 2;
    } else if (leftValid && left !== null) {
      return left;
    } else if (rightValid && right !== null) {
      return right;
    }
    return null;
  }

  private updateFaceDisplay(
    x: number | null,
    y: number | null,
    z: number | null,
    _positionData: UserPositionData
  ): void {
    if (x === null || y === null) {
      this.faceOutlineElement.style.opacity = '0.3';
      return;
    }

    this.faceOutlineElement.style.opacity = '1';

    // Calculate position offset from center
    // x, y are 0-1 where 0.5 is center
    // Y axis is inverted: y=0 is bottom, y=1 is top, so we invert it for screen coordinates
    const offsetX = (x - 0.5) * this.BOX_WIDTH * 0.8;
    const offsetY = (0.5 - y) * this.BOX_HEIGHT * 0.8; // Inverted Y

    // Calculate scale based on distance (z)
    // z is 0-1 where ~0.5 is optimal
    // Based on track box: z=0 means at back (far), z=1 means at front (close)
    let scale = this.OPTIMAL_FACE_SCALE;
    if (z !== null) {
      // z=1 (close) -> MAX_FACE_SCALE, z=0.5 -> OPTIMAL_FACE_SCALE, z=0 (far) -> MIN_FACE_SCALE
      scale = this.MIN_FACE_SCALE + z * (this.MAX_FACE_SCALE - this.MIN_FACE_SCALE);
      scale = Math.max(this.MIN_FACE_SCALE, Math.min(this.MAX_FACE_SCALE, scale));
    }

    this.faceOutlineElement.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`;
  }

  private updateDistanceBar(z: number): void {
    if (!this.distanceBarFill) return;

    // z is 0-1, where z=1 is close (top of bar) and z=0 is far (bottom)
    // Fill from bottom, so height represents z directly (closeness)
    const fillPercent = z * 100;
    this.distanceBarFill.style.height = `${fillPercent}%`;

    // Color based on optimal range derived from distance thresholds
    const goodMin = 0.5 - this.options.distanceThresholdGood;
    const goodMax = 0.5 + this.options.distanceThresholdGood;
    const fairMin = 0.5 - this.options.distanceThresholdFair;
    const fairMax = 0.5 + this.options.distanceThresholdFair;
    let color: string;
    if (z >= goodMin && z <= goodMax) {
      color = this.options.goodColor;
    } else if (z >= fairMin && z <= fairMax) {
      color = this.options.fairColor;
    } else {
      color = this.options.poorColor;
    }
    this.distanceBarFill.style.background = color;
  }

  private updateEyeIndicators(positionData: UserPositionData): void {
    // Update left eye color based on validity
    if (this.leftEyeElement) {
      const leftColor = positionData.leftValid ? this.options.goodColor : this.options.poorColor;
      this.leftEyeElement.setAttribute('fill', leftColor);
    }

    // Update right eye color based on validity
    if (this.rightEyeElement) {
      const rightColor = positionData.rightValid ? this.options.goodColor : this.options.poorColor;
      this.rightEyeElement.setAttribute('fill', rightColor);
    }
  }

  private updateTextualFeedback(x: number | null, y: number | null, z: number | null): void {
    if (!this.feedbackElement) return;

    if (x === null || y === null || z === null) {
      this.feedbackElement.textContent =
        'Eyes not detected - please position yourself in front of the tracker';
      this.feedbackElement.style.color = this.options.poorColor;
      return;
    }

    const quality = this.assessPositionQuality(x, y, z);

    let feedback: string;
    let color: string;

    if (quality.isGoodPosition) {
      feedback = '✓ Position is good';
      color = this.options.goodColor;
    } else {
      const issues: string[] = [];

      // Horizontal feedback — use configurable threshold (offset from 0.5 center)
      const posFairThreshold = this.options.positionThresholdFair;
      if (x < 0.5 - posFairThreshold) issues.push('move right');
      else if (x > 0.5 + posFairThreshold) issues.push('move left');

      // Vertical feedback (y=0 is bottom, y=1 is top)
      if (y < 0.5 - posFairThreshold) issues.push('move up');
      else if (y > 0.5 + posFairThreshold) issues.push('move down');

      // Distance feedback (z=1 is close, z=0 is far)
      const distFairThreshold = this.options.distanceThresholdFair;
      if (z > 0.5 + distFairThreshold) issues.push('move back');
      else if (z < 0.5 - distFairThreshold) issues.push('move closer');

      if (issues.length > 0) {
        feedback = `Please ${issues.join(' and ')}`;
      } else {
        feedback = 'Position: Almost there...';
      }

      color =
        quality.distanceStatus === 'poor' ||
        quality.horizontalStatus === 'poor' ||
        quality.verticalStatus === 'poor'
          ? this.options.poorColor
          : this.options.fairColor;
    }

    this.feedbackElement.textContent = feedback;
    this.feedbackElement.style.color = color;
  }

  private assessPositionQuality(x: number, y: number, z: number): PositionQuality {
    // Assess horizontal position (0.5 is center)
    const xOffset = Math.abs(x - 0.5);
    let horizontalStatus: 'good' | 'fair' | 'poor';
    if (xOffset < this.options.positionThresholdGood) horizontalStatus = 'good';
    else if (xOffset < this.options.positionThresholdFair) horizontalStatus = 'fair';
    else horizontalStatus = 'poor';

    // Assess vertical position (0.5 is center)
    const yOffset = Math.abs(y - 0.5);
    let verticalStatus: 'good' | 'fair' | 'poor';
    if (yOffset < this.options.positionThresholdGood) verticalStatus = 'good';
    else if (yOffset < this.options.positionThresholdFair) verticalStatus = 'fair';
    else verticalStatus = 'poor';

    // Assess distance (0.5 is optimal)
    const zOffset = Math.abs(z - 0.5);
    let distanceStatus: 'good' | 'fair' | 'poor';
    if (zOffset < this.options.distanceThresholdGood) distanceStatus = 'good';
    else if (zOffset < this.options.distanceThresholdFair) distanceStatus = 'fair';
    else distanceStatus = 'poor';

    const isGoodPosition =
      horizontalStatus === 'good' && verticalStatus === 'good' && distanceStatus === 'good';

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
      this.feedbackElement.textContent = 'Waiting for tracker data...';
      this.feedbackElement.style.color = this.options.poorColor;
    }
    this.faceOutlineElement.style.opacity = '0.3';
  }

  /**
   * Get current position quality
   */
  public getCurrentQuality(positionData: UserPositionData | null): PositionQuality {
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

    const avgX = this.getAveragePosition(
      positionData.leftX,
      positionData.rightX,
      positionData.leftValid,
      positionData.rightValid
    );
    const avgY = this.getAveragePosition(
      positionData.leftY,
      positionData.rightY,
      positionData.leftValid,
      positionData.rightValid
    );
    const avgZ = this.getAveragePosition(
      positionData.leftZ,
      positionData.rightZ,
      positionData.leftValid,
      positionData.rightValid
    );

    if (avgX === null || avgY === null || avgZ === null) {
      return {
        isGoodPosition: false,
        horizontalStatus: 'poor',
        verticalStatus: 'poor',
        distanceStatus: 'poor',
        averageX: avgX,
        averageY: avgY,
        averageZ: avgZ,
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
