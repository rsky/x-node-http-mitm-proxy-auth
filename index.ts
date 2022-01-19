import HttpMitmProxy from 'http-mitm-proxy';
import { DateTime } from 'luxon';

// settings
const port = 8081;
const username = 'mitm';
const password = 'proxy';

// constants
const credentials = Buffer.from(`${username}:${password}`).toString('base64');
const expectedProxyAuthorization = `Basic ${credentials}`;
const proxyAuthenticate = 'Basic realm="MITM Proxy"';

// utils
const utcNow = () => DateTime.utc().toISO();

// configure & start the proxy
const proxy = HttpMitmProxy();

proxy.onError((ctx, err) => {
  console.error('proxy error:', err);
});

proxy.onRequest((ctx, callback) => {
  const url = `${ctx.isSSL ? 'https' : 'http'}://${ctx.clientToProxyRequest.headers.host}${ctx.clientToProxyRequest.url}`;
  console.log(`[${utcNow()}] \u001b[36m"${ctx.clientToProxyRequest.method} ${url}"\u001b[0m`);

  if (ctx.clientToProxyRequest.headers['proxy-authorization'] === expectedProxyAuthorization) {
    return callback();
  }

  console.log('proxy authentication required');
  ctx.proxyToClientResponse.statusCode = 407;
  ctx.proxyToClientResponse.statusMessage = 'Proxy Authentication Required';
  ctx.proxyToClientResponse.setHeader('proxy-authenticate', proxyAuthenticate);
  ctx.proxyToClientResponse.end();
  // no callback() so proxy request is not sent to the server
});

proxy.listen({ port });
console.log(`[${utcNow()}] \u001b[1mlistening port ${port}\u001b[0m`);
