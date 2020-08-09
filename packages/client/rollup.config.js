import alias from "@rollup/plugin-alias";

export default {
  input: "./build/index.js",
  output: {
    file: "./dist/index.js",
    format: "esm",
  },
  plugins: [
    alias({
      entries: [
        { find: "shared", replacement: "../../shared/build/" },
        { find: "client", replacement: "./" },
      ],
    }),
  ],
};
