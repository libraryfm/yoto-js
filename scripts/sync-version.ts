const pkg = await Bun.file("package.json").json();
const versionContent = `export const VERSION = "${pkg.version}";\n`;
await Bun.write("src/version.ts", versionContent);
