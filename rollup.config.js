import fs from 'fs';
import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import html from '@rollup/plugin-html';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import postcss from 'rollup-plugin-postcss';

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'iife',
      name: 'DescopeExtension',
      inlineDynamicImports: true
    },
    plugins: [
      postcss({
        extract: true,
        minimize: true
      }),
      del({ targets: 'dist/*' }),
      resolve(),
      commonjs(),
      html({
        fileName: 'index.html',
        title: 'Descope Extension',
      }),
      copy({
        targets: [
          { src: ['public/*'], dest: 'dist' }
        ],
        verbose: true
      }),
    ],
  },
  {
    input: 'src/background.js',
    output: {
      file: 'dist/background.js',
      format: 'iife',
      name: 'DescopeBackground',
      inlineDynamicImports: true
    },
    plugins: [
      resolve(),
      commonjs(),
    ],
  }
];
