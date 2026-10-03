await Bun.build({
    entrypoints: ['./src/advect.ts'],
    outdir: './dist',
    minify:true,
    sourcemap:"external",
    target: "browser",
  });

const file = Bun.file("./dist/advect.js");
await Bun.write("/site/static/advect/advect.js", file);

