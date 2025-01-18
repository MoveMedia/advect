Bun.build({
    entrypoints: ['./src/advect.ts','./src/advect.actions.ts','./src/advect.sharedworker.ts', './src/advect.worker.ts','./src/advect.worker.ts',],
    outdir: './dist',
    minify:true,
    sourcemap:"external",
    target: "browser",
  });
