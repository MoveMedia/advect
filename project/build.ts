Bun.build({
    entrypoints: ['./src/advect.ts'],
    outdir: './dist',
    minify:true,
    sourcemap:"external",
    target: "browser",
  });
