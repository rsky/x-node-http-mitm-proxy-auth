import HttpMitmProxy from 'http-mitm-proxy';
const proxy = HttpMitmProxy();

// settings
const port = 8081;
const username = 'mitm';
const password = 'proxy';

// constants
const credentials = Buffer.from(`${username}:${password}`).toString('base64');
const expectedProxyAuthorization = `Basic ${credentials}`;
const proxyAuthenticate = 'Basic realm="MITM Proxy"';

proxy.onError((ctx, err) => {
  console.error('proxy error:', err);
});

proxy.onRequest((ctx, callback) => {
  console.log(`${ctx.clientToProxyRequest.method} ${ctx.isSSL ? 'https' : 'http'}://${ctx.clientToProxyRequest.headers.host}${ctx.clientToProxyRequest.url}`);

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
console.log(`listening port ${port}`);
