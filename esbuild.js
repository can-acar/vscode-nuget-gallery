const { build } = require("esbuild");
const { spawnSync } = require("child_process");

const isProduction =
  process.env.NODE_ENV === "production" || process.argv.includes("--production");

const baseConfig = {
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  loader: {
    ".png": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".eot": "dataurl",
    ".ttf": "dataurl",
    ".svg": "dataurl",
  },
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/host/extension.ts"],
  outfile: "./dist/extension.js",
  external: ["vscode"],
};

const webConfig = {
  ...baseConfig,
  target: "es6",
  format: "esm",
  entryPoints: ["./src/web/main.ts"],
  outfile: "./dist/web.js",
};

(async () => {
  const buildConfigs = [extensionConfig, webConfig];
  try {
    for (const config of buildConfigs) {
      await build(config);
    }

    const protocolHostBuild = spawnSync(
      "dotnet",
      [
        "publish",
        "./src/protocol-host/CanNugetGallery.ProtocolHost.csproj",
        "-c",
        "Release",
        "-o",
        "./dist/protocol-host",
        "--nologo",
      ],
      { stdio: "inherit" }
    );
    if (protocolHostBuild.status !== 0) {
      process.exit(protocolHostBuild.status ?? 1);
    }

    console.log("build complete");
  } catch (err) {
    process.stderr.write(err.stderr);
    process.exit(1);
  }
})();
