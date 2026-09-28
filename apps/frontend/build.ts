// `bun build` takes no --plugin flag, so the production build runs through Bun.build.
import tailwind from "bun-plugin-tailwind";

// Bun's CSS bundler inlines the two woff2 subsets as data URIs, so the stylesheet
// is ~110KB and there is no flash of the system face. Worth it behind a login,
// where the file is cached after the first visit.

const result = await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  sourcemap: "linked",
  plugins: [tailwind],
  define: { "process.env.NODE_ENV": '"production"' },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`built ${result.outputs.length} files to ./dist`);
