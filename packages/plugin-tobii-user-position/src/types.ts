/**
 * User position data from eye tracker
 */
export interface UserPositionData {
  leftX: number | null;
  leftY: number | null;
  leftZ: number | null;
  rightX: number | null;
  rightY: number | null;
  rightZ: number | null;
  leftValid: boolean;
  rightValid: boolean;
  leftOriginX?: number | null;
  leftOriginY?: number | null;
  leftOriginZ?: number | null;
  rightOriginX?: number | null;
  rightOriginY?: number | null;
  rightOriginZ?: number | null;
}

/**
 * Position quality assessment
 */
export interface PositionQuality {
  isGoodPosition: boolean;
  horizontalStatus: 'good' | 'fair' | 'poor';
  verticalStatus: 'good' | 'fair' | 'poor';
  distanceStatus: 'good' | 'fair' | 'poor';
  averageX: number | null;
  averageY: number | null;
  averageZ: number | null;
}
