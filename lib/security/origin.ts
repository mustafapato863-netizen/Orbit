import "server-only";

function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

export function hasTrustedMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host =
      firstHeaderValue(request.headers.get("x-forwarded-host")) ??
      firstHeaderValue(request.headers.get("host")) ??
      requestUrl.host;
    const protocol =
      firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
      requestUrl.protocol.replace(":", "");

    return (
      originUrl.host.toLowerCase() === host.toLowerCase() &&
      originUrl.protocol === `${protocol.toLowerCase()}:`
    );
  } catch {
    return false;
  }
}
