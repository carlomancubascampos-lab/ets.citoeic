export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const requestOrigin = new URL(request.url).origin;
    const forwardedHost = request.headers
      .get('x-forwarded-host')
      ?.split(',')[0]
      ?.trim();
    const host = forwardedHost || request.headers.get('host');
    const forwardedProtocol = request.headers
      .get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim();
    const protocol =
      forwardedProtocol || new URL(request.url).protocol.slice(0, -1);
    const publicOrigin = host ? `${protocol}://${host}` : null;

    return origin === requestOrigin || origin === publicOrigin;
  } catch {
    return false;
  }
}
