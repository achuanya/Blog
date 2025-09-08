// vite.config.js
import { defineConfig } from "file:///D:/haibao/GitHub/Blog/admin/node_modules/.pnpm/vite@5.4.20_sass@1.92.0_terser@5.44.0/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import autoprefixer from "file:///D:/haibao/GitHub/Blog/admin/node_modules/.pnpm/autoprefixer@10.4.21_postcss@8.5.6/node_modules/autoprefixer/lib/autoprefixer.js";
import tailwindcss from "file:///D:/haibao/GitHub/Blog/admin/node_modules/.pnpm/tailwindcss@3.4.17/node_modules/tailwindcss/lib/index.js";
var __vite_injected_original_dirname = "D:\\haibao\\GitHub\\Blog\\admin";
var vite_config_default = defineConfig({
  // 项目根目录 - 修复为实际项目根目录
  root: ".",
  // 开发服务器配置
  server: {
    port: 3e3,
    host: true,
    // 代理API请求到Express服务器
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false
      }
    }
  },
  // 构建配置
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "assets/admin.css";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    },
    // 生成source map用于调试
    sourcemap: true
  },
  // 静态资源处理
  publicDir: "public",
  // CSS预处理器配置
  css: {
    preprocessorOptions: {
      scss: {
        // 移除不存在的variables.scss引用
      }
    },
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  // 优化配置
  optimizeDeps: {
    exclude: ["simplemde"],
    include: ["markdown-it"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxoYWliYW9cXFxcR2l0SHViXFxcXEJsb2dcXFxcYWRtaW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGhhaWJhb1xcXFxHaXRIdWJcXFxcQmxvZ1xcXFxhZG1pblxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovaGFpYmFvL0dpdEh1Yi9CbG9nL2FkbWluL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcclxuXHJcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ3RhaWx3aW5kY3NzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgLy8gXHU5ODc5XHU3NkVFXHU2ODM5XHU3NkVFXHU1RjU1IC0gXHU0RkVFXHU1OTBEXHU0RTNBXHU1QjlFXHU5NjQ1XHU5ODc5XHU3NkVFXHU2ODM5XHU3NkVFXHU1RjU1XHJcbiAgcm9vdDogJy4nLFxyXG4gIFxyXG4gIC8vIFx1NUYwMFx1NTNEMVx1NjcwRFx1NTJBMVx1NTY2OFx1OTE0RFx1N0Y2RVxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICAvLyBcdTRFRTNcdTc0MDZBUElcdThCRjdcdTZDNDJcdTUyMzBFeHByZXNzXHU2NzBEXHU1MkExXHU1NjY4XHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIFxyXG4gIC8vIFx1Njc4NFx1NUVGQVx1OTE0RFx1N0Y2RVxyXG4gIGJ1aWxkOiB7XHJcbiAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBpbnB1dDoge1xyXG4gICAgICAgIG1haW46IHJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpXHJcbiAgICAgIH0sXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XHJcbiAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgJiYgYXNzZXRJbmZvLm5hbWUuZW5kc1dpdGgoJy5jc3MnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9hZG1pbi5jc3MnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXSc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gXHU3NTFGXHU2MjEwc291cmNlIG1hcFx1NzUyOFx1NEU4RVx1OEMwM1x1OEJENVxyXG4gICAgc291cmNlbWFwOiB0cnVlXHJcbiAgfSxcclxuICBcclxuICAvLyBcdTk3NTlcdTYwMDFcdThENDRcdTZFOTBcdTU5MDRcdTc0MDZcclxuICBwdWJsaWNEaXI6ICdwdWJsaWMnLFxyXG4gIFxyXG4gIC8vIENTU1x1OTg4NFx1NTkwNFx1NzQwNlx1NTY2OFx1OTE0RFx1N0Y2RVxyXG4gIGNzczoge1xyXG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICBzY3NzOiB7XHJcbiAgICAgICAgLy8gXHU3OUZCXHU5NjY0XHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0dmFyaWFibGVzLnNjc3NcdTVGMTVcdTc1MjhcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHBvc3Rjc3M6IHtcclxuICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgIHRhaWx3aW5kY3NzLFxyXG4gICAgICAgIGF1dG9wcmVmaXhlclxyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfSxcclxuICBcclxuICAvLyBcdTRGMThcdTUzMTZcdTkxNERcdTdGNkVcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGV4Y2x1ZGU6IFsnc2ltcGxlbWRlJ10sXHJcbiAgICBpbmNsdWRlOiBbJ21hcmtkb3duLWl0J11cclxuICB9XHJcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlEsU0FBUyxvQkFBb0I7QUFDMVMsU0FBUyxlQUFlO0FBRXhCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8saUJBQWlCO0FBSnhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUIsTUFBTTtBQUFBO0FBQUEsRUFHTixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUVOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxRQUFRLGtDQUFXLFlBQVk7QUFBQSxNQUN2QztBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCLENBQUMsY0FBYztBQUM3QixjQUFJLFVBQVUsUUFBUSxVQUFVLEtBQUssU0FBUyxNQUFNLEdBQUc7QUFDckQsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsV0FBVztBQUFBLEVBQ2I7QUFBQTtBQUFBLEVBR0EsV0FBVztBQUFBO0FBQUEsRUFHWCxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUE7QUFBQSxNQUVOO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxXQUFXO0FBQUEsSUFDckIsU0FBUyxDQUFDLGFBQWE7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
