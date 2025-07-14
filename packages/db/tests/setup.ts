import { beforeAll } from "bun:test";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

export const db = drizzle({ casing: "snake_case" });

// 使用 Bun 的文件系统 API 动态导入
const dynamicImportSchemas = async () => {
	const schemaPath = new URL("../src/schema", import.meta.url).pathname;

	try {
		// 使用 Bun.file 读取目录
		const files = await Array.fromAsync(new Bun.Glob("*.ts").scan(schemaPath));
		const schemas = {};
		for (const file of files) {
			const modulePath = `../src/schema/${file}`;

			try {
				const module = await import(modulePath);
				Object.assign(schemas, module);
			} catch (error) {
				console.warn(`无法导入 schema 文件: ${modulePath}`, error);
			}
		}

		return schemas;
	} catch (error) {
		console.warn("无法读取 schema 目录", error);
		return {};
	}
};

const initializeDB = async () => {
	const schema = await dynamicImportSchemas();

	const prev = generateDrizzleJson({});
	const cur = generateDrizzleJson(schema, prev.id, undefined, "snake_case");
	const statements = await generateMigration(prev, cur);
	for (const statement of statements) {
		await db.execute(statement);
	}
};

beforeAll(async () => {
	await initializeDB();
});
