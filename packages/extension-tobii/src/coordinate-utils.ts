/**
 * Coordinate conversion utilities
 */

import type { Coordinates, ScreenDimensions } from './types';

/**
 * Convert normalized coordinates (0-1) to pixels
 */
export function normalizedToPixels(x: number, y: number): Coordinates {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    x: Math.round(x * width),
    y: Math.round(y * height),
  };
}

/**
 * Convert pixel coordinates to normalized (0-1)
 */
export function pixelsToNormalized(x: number, y: number): Coordinates {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    x: x / width,
    y: y / height,
  };
}

/**
 * Get screen dimensions
 */
export function getScreenDimensions(): ScreenDimensions {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if coordinates are within bounds
 */
export function isWithinBounds(x: number, y: number, normalized: boolean = true): boolean {
  if (normalized) {
    return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  } else {
    return x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight;
  }
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Coordinates, p2: Coordinates): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle in degrees between two points
 */
export function angle(p1: Coordinates, p2: Coordinates): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Convert window pixel coordinates to container-relative coordinates
 */
export function windowToContainer(x: number, y: number, container: HTMLElement): Coordinates {
  const rect = container.getBoundingClientRect();
  return {
    x: Math.round(x - rect.left),
    y: Math.round(y - rect.top),
  };
}

/**
 * Get container dimensions
 */
export function getContainerDimensions(container: HTMLElement): ScreenDimensions {
  const rect = container.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Check if window coordinates fall within a container
 */
export function isWithinContainer(x: number, y: number, container: HTMLElement): boolean {
  const rect = container.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
