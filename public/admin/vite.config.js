import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  // 项目根目录
  root: '.',
  
  // 路径别名配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/lib': resolve(__dirname, 'src/lib')
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3002,
    host: true,
    allowedHosts: ['admin.lhasa.icu'],
    // 代理API请求到Express服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/admin.css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // 生成source map用于调试
    sourcemap: true
  },
  
  // 静态资源处理
  publicDir: 'public',
  
  // CSS预处理器配置
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS配置
      }
    },
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  
  // 依赖优化
  optimizeDeps: {
    exclude: ['simplemde'],
    include: ['markdown-it']
  }
});