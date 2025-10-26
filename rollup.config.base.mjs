import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

/**
 * Base Rollup configuration factory
 * @param {Object} options
 * @param {string} options.packageName - Name of the package (e.g., 'extension-tobii')
 * @param {boolean} options.includeCSS - Whether to include CSS processing
 * @returns {Array} Rollup configuration array
 */
export function createConfig(options) {
  const { packageName, includeCSS = false } = options;

  const plugins = [
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      declaration: true,
      declarationDir: './dist',
    }),
  ];

  if (includeCSS) {
    plugins.push(
      postcss({
        extract: true,
        minimize: true,
      })
    );
  }

  return [
    // ESM build
    {
      input: 'src/index.ts',
      output: {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
      },
      external: ['jspsych'],
      plugins,
    },
    // CommonJS build
    {
      input: 'src/index.ts',
      output: {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
      },
      external: ['jspsych'],
      plugins,
    },
    // Browser build (minified)
    {
      input: 'src/index.ts',
      output: {
        file: 'dist/index.browser.min.js',
        format: 'iife',
        name: packageName.replace(/-/g, '_'),
        sourcemap: true,
        globals: {
          jspsych: 'jsPsych',
        },
      },
      external: ['jspsych'],
      plugins: [...plugins, terser()],
    },
  ];
}
