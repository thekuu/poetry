import { db } from "./backend/src/db/index.js";
import { poems } from "./backend/src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    try {
        const result = await db.update(poems).set({ type: 'formal' }).where(eq(poems.type, 'standard'));
        console.log("Updated poems!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
