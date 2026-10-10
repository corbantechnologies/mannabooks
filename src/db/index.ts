import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

function createProxyChain(): any {
    const handler: ProxyHandler<any> = {
        get(_target, prop) {
            if (prop === "then") {
                // Allows awaiting any db query chain: e.g. await db.select().from(...).where(...)
                return (resolve: (v: any) => void) => resolve([]);
            }
            if (prop === "findFirst") {
                return async () => null;
            }
            if (prop === "findMany") {
                return async () => [];
            }
            if (prop === "query") {
                return new Proxy({}, {
                    get(_qTarget, _table) {
                        return {
                            findFirst: async () => null,
                            findMany: async () => [],
                        };
                    }
                });
            }
            // Return chainable proxy for any method call: select(), from(), where(), insert(), update(), delete(), etc.
            return (..._args: any[]) => createProxyChain();
        },
        apply(_target, _thisArg, _argArray) {
            return createProxyChain();
        }
    };
    return new Proxy(() => {}, handler);
}

export const db = createProxyChain() as unknown as ReturnType<typeof drizzle<typeof schema>>;