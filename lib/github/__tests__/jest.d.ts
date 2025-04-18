declare const jest: {
  mock: (moduleName: string, factory?: () => any) => void;
  spyOn: (obj: any, methodName: string) => any;
  fn: () => any;
  clearAllMocks: () => void;
  requireActual: (moduleName: string) => any;
};

declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function it(name: string, fn: () => Promise<void> | void): void;
declare function expect(actual: any): any; 