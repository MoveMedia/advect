import index from './index.html'

Bun.serve({
    port: 61594,
    routes:{
        "/": index,
    }
})