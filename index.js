const Proxy = require('http-mitm-proxy');
const proxy = Proxy();

const port = 8081;
const username = 'mitm';
const password = 'proxy';
const credentials = Buffer.from(`${username}:${password}`).toString('base64');

proxy.onError((ctx, err) => {
  console.error('proxy error:', err);
});

proxy.onRequest((ctx, callback) => {
  console.log(`${ctx.clientToProxyRequest.method} http://${ctx.clientToProxyRequest.headers.host}${ctx.clientToProxyRequest.url}`);

  if (ctx.clientToProxyRequest.headers['proxy-authorization'] === `Basic ${credentials}`) {
    return callback();
  }

  console.log('proxy authentication required');
  ctx.proxyToClientResponse.statusCode = 407;
  ctx.proxyToClientResponse.statusMessage = 'Proxy Authentication Required';
  ctx.proxyToClientResponse.setHeader('proxy-authenticate', 'Basic realm="MITM Proxy"');
  ctx.proxyToClientResponse.end();
  // no callback() so proxy request is not sent to the server
});

proxy.listen({ port });
