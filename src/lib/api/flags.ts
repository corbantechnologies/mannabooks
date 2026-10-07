// src/lib/api/flags.ts

/**
 * Checks whether a specific domain module has been toggled to execute via FastAPI.
 * Controlled by process.env.API_MODULES (e.g. "auth,workspaces,etims").
 */
export function isApiModuleEnabled(moduleName: string): boolean {
  const enabledModules = (process.env.API_MODULES || "").toLowerCase().split(",").map(m => m.trim());
  return enabledModules.includes("all") || enabledModules.includes(moduleName.toLowerCase());
}
