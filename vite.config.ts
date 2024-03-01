import { defineConfig } from 'vite'
import path from 'path'
console.log('custom conf')
export default defineConfig({
    build: {
        rollupOptions: {
          input:{
            advect: path.resolve(__dirname, 'src','advect.ts'),
            'advect.compiler': path.resolve(__dirname, 'src','compiler.ts')
          },
          output: {
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            assetFileNames: `[name].[ext]`
          }
        }
      }
})