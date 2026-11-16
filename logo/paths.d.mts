// Types for logo/paths.mjs.
export interface LogoPaths {
  width: number;
  height: number;
  viewBox: string;
  letters: string;
  bar: string;
}
export declare const MARK: LogoPaths;
export declare const TILE: LogoPaths & { radius: number };
