export interface CalibrationOffsets {
  baroOffsetHpa: number;
  tempOffsetC: number;
}

export const DEFAULT_CALIBRATION: CalibrationOffsets = {
  baroOffsetHpa: 0,
  tempOffsetC: 0,
};