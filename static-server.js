import { createSecureServer } from 'http2';
import { readFileSync } from 'fs';
import { lookup } from 'mime-types';

const cached = process.argv[2] === 'cached';

const server = createSecureServer({
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});

server.on('error', err => console.error(err));

const staticFileCache = Object.create(null);

const cacheControl = cached ? 'public, max-age=3600' : 'no-cache';

const POOL_MAX = 16;
let streamCnt = 0;
const poolQueue = [];

function streamEnd () {
  streamCnt--;
  if (streamCnt === 0) {
    while (streamCnt < POOL_MAX && poolQueue.length) {
      const { stream, source } = poolQueue.shift();
      stream.end(source);
      streamCnt++;
    }
  }
}

server.on('stream', (stream, headers) => {
  if (headers[':method'] !== 'GET')
    throw new Error('Expected GET');

  let path = headers[':path'].slice(1);
  const queryStringIndex = path.indexOf('?');
  if (queryStringIndex !== -1)
    path = path.slice(0, queryStringIndex);

  let entry = staticFileCache[path];
  if (!entry) {
    try {
      var source = readFileSync(path);
    }
    catch (e) {
      stream.respond({ ':status': 404, 'content-type': 'text/plain; charset=utf-8' });
      stream.end('Not found');
      return;
    }
    entry = staticFileCache[path] = {
      contentType: lookup(path),
      source
    };
  }

  stream.respond({ ':status': 200, 'content-type': entry.contentType, 'cache-control': cacheControl, 'Access-Control-Allow-Origin': '*' });

  stream.on('close', streamEnd);
  if (streamCnt !== POOL_MAX) {
    streamCnt++;
    stream.end(entry.source);
  }
  else {
    poolQueue.push({ stream, source: entry.source });
  }
});

server.listen(8000);
console.log('Listening on 8000');
