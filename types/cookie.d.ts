declare module 'cookie' {
  export function serialize(name: string, val: string, options?: any): string
  export function parse(str: string, options?: any): Record<string, string>
}
