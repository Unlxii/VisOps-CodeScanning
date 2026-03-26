import { headers } from "next/headers";
import { notFound } from "next/navigation";
import SwaggerUI from "@/components/SwaggerUI";

export default async function ApiDocsPage() {
  const host = (await headers()).get("host");
  const isLocal = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") || process.env.NODE_ENV === "development";

  if (!isLocal) {
    notFound();
  }

  return <SwaggerUI url="/api/docs" />;
}
