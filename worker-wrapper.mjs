import generatedWorker, {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from './.open-next/worker.js';


function isNextImageRequest(request) {
  const pathname = new URL(request.url).pathname;
  return pathname === '/_next/image' || pathname === '/_next/image/';
}

export function withServerRequestId(response, requestId = response.headers.get('x-request-id') ?? crypto.randomUUID()) {
  const wrapped = new Response(response.body, response);
  wrapped.headers.set('x-request-id', requestId);
  return wrapped;
}

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };

export default {
  async fetch(request, env, ctx) {
    const response = await generatedWorker.fetch(request, env, ctx);
    return withServerRequestId(response);
  },
};
