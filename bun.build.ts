const fs = require('fs').promises;
const path = require('path');

async function copyFiles(srcDir:string, destDir:string) {
    try {
        const files = await fs.readdir(srcDir);
        for (let file of files) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            await fs.copyFile(srcFile, destFile);
        }
        console.log("Files copied successfully!");
    } catch (error) {
        console.error(`Error in copying files: ${error}`);
    }
}


await Bun.build({
    entrypoints: [
        './src/advect.ts',
        './src/advect.worker.ts',
    ],
    outdir: './dist',
    minify: {
        whitespace: true,
        identifiers: true,
        syntax: true,
      },
  });