declare module "bun:test" {
  export function describe(nome: string, fn: () => void): void;
  export function it(nome: string, fn: () => void | Promise<void>): void;
  export function test(nome: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function expect(valor: unknown): {
    toBe(esperado: unknown): void;
    toEqual(esperado: unknown): void;
    toContain(esperado: unknown): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(valor: number): void;
    toBeGreaterThanOrEqual(valor: number): void;
    toBeLessThan(valor: number): void;
    toBeLessThanOrEqual(valor: number): void;
    toHaveLength(valor: number): void;
    toThrow(esperado?: unknown): void;
    not: {
      toBe(esperado: unknown): void;
      toEqual(esperado: unknown): void;
      toContain(esperado: unknown): void;
      toBeDefined(): void;
      toBeNull(): void;
      toThrow(esperado?: unknown): void;
    };
  };
}
