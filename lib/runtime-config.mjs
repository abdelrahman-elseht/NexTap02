const ENVIRONMENT_NAMESPACES = ['development', 'staging', 'production'];

export { ENVIRONMENT_NAMESPACES };

export class RuntimeConfigError extends TypeError {
  constructor(message, code = 'invalid_environment') {
    super(message);
    this.name = 'RuntimeConfigError';
    this.code = code;
  }
}

function readIdentityInput(input) {
  if (typeof input === 'string') return { environment: input };
  if (input && typeof input === 'object') {
    const environment = input.environment ?? input.env ?? input.name;
    return { environment, namespace: input.namespace };
  }
  return { environment: undefined };
}

/**
 * Parse the one environment identity accepted by a runtime boundary.
 * Namespace is intentionally equal to the environment name so a caller
 * cannot silently point a staging process at a production namespace.
 */
export function parseEnvironmentIdentity(input) {
  const { environment, namespace } = readIdentityInput(input);
  if (typeof environment !== 'string' || !ENVIRONMENT_NAMESPACES.includes(environment)) {
    throw new RuntimeConfigError('Environment must be development, staging, or production');
  }
  if (namespace !== undefined && (typeof namespace !== 'string' || namespace !== environment)) {
    throw new RuntimeConfigError('Environment namespace must match the environment');
  }
  return Object.freeze({ environment, namespace: environment });
}

export function validateEnvironmentIdentity(input) {
  try {
    parseEnvironmentIdentity(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build explicit, immutable runtime configuration without reading provider
 * state or falling back to production when identity is omitted.
 */
export function createRuntimeConfig(input = {}) {
  const identity = parseEnvironmentIdentity(input);
  const source = input && typeof input === 'object' ? input : {};
  const { environment: ignoredEnvironment, env: ignoredEnv, name: ignoredName, namespace: ignoredNamespace, ...rest } = source;
  void ignoredEnvironment;
  void ignoredEnv;
  void ignoredName;
  void ignoredNamespace;
  return Object.freeze({ ...rest, ...identity });
}

export const parseRuntimeEnvironment = parseEnvironmentIdentity;
export const validateRuntimeEnvironment = validateEnvironmentIdentity;
