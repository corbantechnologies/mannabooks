// src/lib/api/flags.ts

/**
 * Checks whether a specific domain module has been toggled to execute via FastAPI.
 * Controlled by process.env.API_MODULES (e.g. "auth,workspaces,etims").
 */
export function isApiModuleEnabled(moduleName: string): boolean {
  const envVal = process.env.API_MODULES;
  if (!envVal || envVal === "all" || envVal === "*") return true;
  const enabledModules = envVal.toLowerCase().split(",").map(m => m.trim());
  return enabledModules.includes("all") || enabledModules.includes(moduleName.toLowerCase());
}

