import "dotenv/config";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "../databases/data");

function splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1];
        
        // Handle single-line comments --
        if (!inSingleQuote && !inDoubleQuote && char === '-' && nextChar === '-') {
            while (i < sql.length && sql[i] !== '\n') {
                i++;
            }
            continue;
        }
        
        // Handle multi-line comments /* */
        if (!inSingleQuote && !inDoubleQuote && char === '/' && nextChar === '*') {
            i += 2;
            while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) {
                i++;
            }
            i++; // skip /
            continue;
        }
        
        // Handle single quotes and escapes
        if (char === "'") {
            if (inSingleQuote && nextChar === "'") {
                current += "''";
                i++; // skip next single quote
                continue;
            }
            inSingleQuote = !inSingleQuote;
        } else if (char === '"') {
            inDoubleQuote = !inDoubleQuote;
        }
        
        if (char === ';' && !inSingleQuote && !inDoubleQuote) {
            if (current.trim()) {
                statements.push(current.trim());
            }
            current = "";
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        statements.push(current.trim());
    }
    return statements;
}

async function runSeeds() {
    const pool = new Pool({
        host: process.env.DB_HOST ?? "localhost",
        port: parseInt(process.env.DB_PORT ?? "5432", 10),
        user: process.env.DB_USER ?? "postgres",
        password: process.env.DB_PASSWORD ?? "",
        database: process.env.DB_NAME ?? "ehealthdatabase",
    });

    // We want to run files in range 1 to 21
    const minNum = 1;
    const maxNum = 21;

    const files = fs
        .readdirSync(DATA_DIR)
        .filter((f) => f.endsWith(".sql"))
        .filter((f) => {
            const m = f.match(/^(\d+)([a-z]?)_/);
            if (!m) return false;
            const num = parseInt(m[1], 10);
            return num >= minNum && num <= maxNum;
        })
        .sort();

    console.log(`▶ Starting transaction-less idempotent run of ${files.length} seed files:`);
    
    for (const f of files) {
        const sqlPath = path.join(DATA_DIR, f);
        const sql = fs.readFileSync(sqlPath, "utf8");
        console.log(`\n  → Processing file: ${f}`);
        
        const statements = splitSqlStatements(sql);
        let successCount = 0;
        let duplicateCount = 0;
        let failCount = 0;

        for (let statement of statements) {
            const trimmed = statement.trim().toUpperCase();
            if (!trimmed || trimmed === "BEGIN" || trimmed === "COMMIT" || trimmed === "ROLLBACK") {
                continue;
            }

            try {
                await pool.query(statement);
                successCount++;
            } catch (e: any) {
                if (e.code === '23505') { // unique_violation
                    duplicateCount++;
                } else {
                    failCount++;
                    console.error(`    ❌ Error in statement: ${statement.substring(0, 100)}...`);
                    console.error(`       Details:`, e.message);
                }
            }
        }
        console.log(`    📊 Results: ${successCount} queries OK, ${duplicateCount} duplicates skipped, ${failCount} failed.`);
    }

    await pool.end();
    console.log("\n✓ All seeds processed.");
}

runSeeds().catch((e) => {
    console.error("Runner failed:", e);
});
