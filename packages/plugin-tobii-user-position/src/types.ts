export type { UserPositionData } from '@jspsych/extension-tobii';

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
