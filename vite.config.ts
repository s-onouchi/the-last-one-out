import { defineConfig } from "vite";

// GitHub Pages serves the game from https://s-onouchi.github.io/the-last-one-out/,
// so production builds (and `vite preview` of them) need that sub-path as base.
// The dev server stays at "/".
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/the-last-one-out/" : "/",
  server: { port: 5173, strictPort: true },
}));
