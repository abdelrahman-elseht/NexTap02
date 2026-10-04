import {
  MaintenanceError,
  assertMaintenanceConfiguration,
  maintenanceEnvironmentFromRequest,
  maintenanceSecretFromRequest,
  runMaintenance,
} from '../../../../lib/maintenance.mjs';
import { requestId } from '../../../../lib/admin-errors.mjs';

export const dynamic = 'force-dynamic';

function runtimeDependencies() {
  const injected = globalThis.__NEXTAP_MAINTENANCE__ ?? {};
  const expectedSecret = process.env.NEXTAP_MAINTENANCE_SECRET ?? process.env.MAINTENANCE_INTERNAL_SECRET;
  const expectedEnvironmentId = process.env.NEXTAP_ENVIRONMENT_ID ?? process.env.RUNTIME_ENVIRONMENT_ID ?? process.env.ENVIRONMENT_ID;
  return {
    candidates: injected.candidates,
    objectStore: injected.objectStore,
    expectedSecret,
    expectedEnvironmentId,
  };
}

function responseBody({ status, code, message, id, data }) {
  const body = data === undefined ? { error: { code, message, requestId: id } } : { data, requestId: id };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': id,
    },
  });
}

function safeMessage(error, status) {
  if (error instanceof MaintenanceError && status !== 503) return error.message;
  return status === 401 ? 'Maintenance authentication is required.'
    : status === 403 ? 'Maintenance access is forbidden.'
      : status === 409 ? 'The maintenance request could not be completed.'
        : 'The service is temporarily unavailable.';
}

export async function POST(request) {
  const id = requestId(request);
  const runtime = runtimeDependencies();
  try {
    assertMaintenanceConfiguration({
      secret: maintenanceSecretFromRequest(request),
      environmentId: maintenanceEnvironmentFromRequest(request),
      expectedSecret: runtime.expectedSecret,
      expectedEnvironmentId: runtime.expectedEnvironmentId,
    });

    let body = {};
    if (request?.body) {
      try {
        body = await request.json();
      } catch {
        throw new MaintenanceError('invalid_request', 'The maintenance request could not be completed.', 409);
      }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new MaintenanceError('invalid_request', 'The maintenance request could not be completed.', 409);
    }

    const data = await runMaintenance({
      candidates: runtime.candidates,
      objectStore: runtime.objectStore,
      limit: body.limit,
    });
    return responseBody({ status: 200, id, data });
  } catch (error) {
    const status = error instanceof MaintenanceError && [401, 403, 409, 503].includes(error.status) ? error.status : 503;
    const code = error instanceof MaintenanceError ? error.code : 'temporarily_unavailable';
    return responseBody({ status, code, message: safeMessage(error, status), id });
  }
}

export async function GET(request) {
  const id = requestId(request);
  return responseBody({ status: 409, code: 'method_not_allowed', message: 'The maintenance request could not be completed.', id });
}
