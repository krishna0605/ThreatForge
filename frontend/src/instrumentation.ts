
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // We only need to import this when running on the server
    import('./instrumentation.node');
  }
}
