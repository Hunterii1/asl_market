/**
 * Fallback type declarations for vitest when the package is not yet installed.
 * After running `npm install`, the real vitest types from node_modules will be used.
 */
declare module "vitest" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export const expect: {
    (value: unknown): {
      toBe(expected: unknown): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toEqual(expected: unknown): void;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}
