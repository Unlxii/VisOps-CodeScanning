// instrumentation.ts
// Next.js OpenTelemetry instrumentation — runs on server startup.
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry
//
// To enable: set OTEL_EXPORTER_OTLP_ENDPOINT in .env (e.g. http://localhost:4318)
// or OTEL_EXPORTER_CONSOLE=true for local console output during development.

export async function register() {
  // Only instrument on server (not edge runtime or client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { ConsoleSpanExporter } = await import("@opentelemetry/sdk-trace-node");

    const useConsole = process.env.OTEL_EXPORTER_CONSOLE === "true";
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const exporter = useConsole
      ? new ConsoleSpanExporter()
      : otlpEndpoint
      ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` })
      : null;

    if (!exporter) {
      // No exporter configured — skip (don't instrument prod unless explicitly enabled)
      return;
    }

    const sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME ?? "visscan-web",
      traceExporter: exporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable fs instrumentation (very noisy in Next.js builds)
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();
    console.log(
      `[OpenTelemetry] Tracing started → ${useConsole ? "console" : otlpEndpoint}`
    );
  }
}
