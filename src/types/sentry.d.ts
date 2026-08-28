declare module '@sentry/react' {
  export function init(options: Record<string, unknown>): void;
  export function captureException(error: unknown): void;
}
