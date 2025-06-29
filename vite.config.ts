import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    minify: "terser",
    sourcemap: false,
    reportCompressedSize: true,
    target: "esnext",
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
        pure_funcs: ["console.log", "console.info", "console.warn"],
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        unsafe_comps: true,
        dead_code: true,
        unused: true,
        reduce_vars: true,
        collapse_vars: true,
        inline: 3,
        join_vars: true,
        loops: true,
        pure_getters: true,
        sequences: true,
        conditionals: true,
        evaluate: true,
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: true,
        if_return: true,
        negate_iife: true,
        properties: true,
        side_effects: true,
        switches: true,
        toplevel: true,
        typeofs: true,
      },
      mangle: {
        safari10: true,
        toplevel: true,
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.js"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        compact: true,
        manualChunks: (id) => {
          // More aggressive chunking for better compression
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("@radix-ui")) {
              return "radix-vendor";
            }
            if (id.includes("lucide-react")) {
              return "icons-vendor";
            }
            if (id.includes("tailwind") || id.includes("clsx") || id.includes("class-variance-authority")) {
              return "utils-vendor";
            }
            return "vendor";
          }
          if (id.includes("src/components/ui")) {
            return "ui-components";
          }
        },
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
        preset: "smallest",
      },
      external: [],
    },
    cssCodeSplit: true,
    outDir: resolve(__dirname, "dist"),
    assetsDir: "assets",
    chunkSizeWarningLimit: 500,
  },
  esbuild: {
    treeShaking: true,
    legalComments: "none",
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    target: "esnext",
    drop: ["console", "debugger"],
    pure: ["console.log", "console.info", "console.warn", "console.error"],
  },
});
