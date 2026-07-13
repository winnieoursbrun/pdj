import * as Sentry from '@sentry/react'

export function initSentry() {
  Sentry.init({
    dsn: 'https://912feabd33e9998de0fe13ad1c380af3@o4510976802357248.ingest.de.sentry.io/4511730062327888',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    ],
    // Tracing
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Logs
    enableLogs: true,
  })
}
