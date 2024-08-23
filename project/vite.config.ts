import { defineConfig } from 'vite'
import path from 'path'
export default defineConfig({
 
    build: {
        sourcemap: true,
        rollupOptions: {
          input:{
            advect: path.resolve(__dirname, 'src','advect.ts'),
          },
          output: {
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            assetFileNames: `[name].[ext]`
          }
        }
      }
})