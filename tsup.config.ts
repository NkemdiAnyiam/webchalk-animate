import type { Options } from 'tsup';

export const tsup: Options = {
  splitting: true,
  clean: true, // clean up the dist folder
  dts: true, // generate dts files
  format: ['cjs', 'esm'], // generate cjs and esm files
  // minify: env === 'production',
  minify: true,
  // bundle: env === 'production',
  bundle: false,
  skipNodeModulesBundle: true,
  // watch: env === 'development',
  watch: false,
  target: 'es2020',
  // outDir: env === 'production' ? 'dist' : 'lib',
  outDir: 'dist',
  entry: ['src/**/*.ts', 'src/**/*.js'], // include all TS and JS files under src
  tsconfig: './tsconfig.build.json',
  replaceNodeEnv: true,
  keepNames: true,
};
