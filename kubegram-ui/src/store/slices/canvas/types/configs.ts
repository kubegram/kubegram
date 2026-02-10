/**
 * Canvas configuration types
 */

/**
 * Dimensions interface
 */
export interface Dimensions {
    width: number;
    height: number;
}

/**
 * Canvas configuration state
 */
export interface CanvasConfigs {
    dimensions: Dimensions;
    canvasSize: Dimensions;
}
