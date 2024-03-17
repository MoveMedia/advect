import { defineConfig } from 'vite'
import path from 'path'
console.log('custom conf')
export default defineConfig({
    build: {
        rollupOptions: {
          input:{
            dds: path.resolve(__dirname, 'src','dds.ts'),
            dds_test: path.resolve(__dirname,'dds.html')

          },
          output: {
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            assetFileNames: `[name].[ext]`
          }
        }
      }
})