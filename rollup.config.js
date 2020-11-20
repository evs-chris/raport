import ractive from 'rollup-plugin-ractive-bin';
import typescript from '@rollup/plugin-typescript';
import node from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser'

const configs = [
  {
    input: 'src/lib/index.ts',
    output: [{
      file: 'build/lib/raport.umd.js',
      format: 'umd',
      name: 'Raport',
      sourcemap: true,
    }],
    plugins: [
      typescript({
        include: ['src/lib/**/*.ts'],
      }),
      sourcemaps(),
      node(),
    ],
  },
  {
    input: 'src/design/index.ts',
    external: ['ractive', /^raport/],
    output: [{
      file: 'build/lib/raport.design.umd.js',
      format: 'umd',
      name: 'Raport.Design',
      sourcemap: true,
      globals: {
        'raport': 'Raport',
        'ractive': 'Ractive',
        'raport/index': 'Raport',
      }
    }],
    plugins: [
      ractive({
        root: 'views',
        outputDir: '.views',
        outputExtension: '.ts',
        autoExport: true,
      }),
      typescript({
        include: [
          "src/**/*.ts",
          ".views/**/*.ts",
        ]
      }),
      sourcemaps(),
      node(),
    ],
  },
];

if (process.env.ENV === 'dev') {
  configs.push({
    input: 'src/play/index.ts',
    external: ['ractive', /^raport/, /^design/],
    output: {
      file: 'play/index.js',
      format: 'iife',
      name: 'play',
      sourcemap: true,
      globals: {
        'ractive': 'Ractive',
        'raport': 'Raport',
        'design': 'Raport.Design',
        'raport/index': 'Raport',
        'design/index': 'Raport.Design',
      }
    },
    plugins: [
      typescript({
        include: ['src/**/*.ts'],
      }),
      sourcemaps(),
      node(),
    ],
  });
} else if (process.env.ENV === 'prod') {
  configs[0].output.push({
    file: 'build/lib/raport.min.umd.js',
    format: 'umd',
    name: 'Raport',
    sourcemap: true,
    plugins: [terser()],
  });
  configs[1].output.push({
    file: 'build/lib/raport.design.min.umd.js',
    format: 'umd',
    name: 'Raport.Design',
    sourcemap: true,
    globals: {
      'raport': 'Raport',
      'ractive': 'Ractive',
      'raport/index': 'Raport',
    },
    plugins: [terser()],
  });
}

export default configs;
