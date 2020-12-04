import ractive from 'rollup-plugin-ractive-bin';
import typescript from '@rollup/plugin-typescript';
import node from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser'

const configs = [];

if (process.env.ENV === 'dev') {
  // build lib es and umd
  configs.push({
    input: 'src/lib/index.ts',
    output: [{
      dir: 'lib',
      format: 'umd',
      entryFileNames: 'raport.umd.js',
      name: 'Raport',
      sourcemap: true,
    }, {
      file: 'lib/index.js',
      format: 'module',
      sourcemap: true,
    }],
    plugins: [
      typescript({
        include: ['src/lib/**/*.ts'],
        sourceMap: true,
      }),
      sourcemaps(),
      node(),
    ],
  });

  // build designer es and umd
  configs.push({
    input: 'src/design/index.ts',
    external: ['ractive', /^raport/],
    output: [{
      dir: 'design',
      format: 'umd',
      name: 'Raport.Design',
      entryFileNames: 'raport.design.umd.js',
      sourcemap: true,
      globals: {
        'raport': 'Raport',
        'ractive': 'Ractive',
        'raport/index': 'Raport',
      }
    }, {
      file: 'design/index.js',
      format: 'module',
      sourcemap: true,
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
          'src/design/**/*.ts',
        ],
        paths: {
          'raport/*': ['src/lib/*'],
          'views/*': ['.views/views/*']
        },
        sourceMap: true,
      }),
      sourcemaps(),
      node(),
    ],
  });

  // build playground
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
        sourceMap: true,
      }),
      sourcemaps(),
      node(),
    ],
  });
} else if (process.env.ENV === 'prod') {
  // build lib es and umd with min
  configs.push({
    input: 'src/lib/index.ts',
    output: [{
      dir: 'lib',
      format: 'umd',
      entryFileNames: 'raport.umd.js',
      name: 'Raport',
      sourcemap: true,
    }, {
      dir: 'lib',
      format: 'umd',
      entryFileNames: 'raport.umd.min.js',
      name: 'Raport',
      sourcemap: true,
      plugins: [terser()],
    }, {
      dir: 'lib',
      format: 'module',
      entryFileNames: 'index.js',
      sourcemap: true,
    }, {
      dir: 'lib',
      entryFileNames: 'index.min.js',
      format: 'module',
      sourcemap: true,
      plugins: [terser()]
    }],
    plugins: [
      typescript({
        include: ['src/lib/**/*.ts'],
        sourceMap: true,
      }),
      sourcemaps(),
      node(),
    ],
  });

  // build designer es and umd with min
  configs.push({
    input: 'src/design/index.ts',
    external: ['ractive', /^raport/],
    output: [{
      dir: 'design',
      format: 'umd',
      name: 'Raport.Design',
      entryFileNames: 'raport.design.umd.js',
      sourcemap: true,
      globals: {
        'raport': 'Raport',
        'ractive': 'Ractive',
        'raport/index': 'Raport',
      }
    }, {
      dir: 'design',
      format: 'umd',
      name: 'Raport.Design',
      entryFileNames: 'raport.design.umd.min.js',
      sourcemap: true,
      globals: {
        'raport': 'Raport',
        'ractive': 'Ractive',
        'raport/index': 'Raport',
      },
      plugins: [terser()]
    }, {
      dir: 'design',
      entryFileNames: 'index.js',
      format: 'module',
      sourcemap: true,
    }, {
      dir: 'design',
      entryFileNames: 'index.min.js',
      format: 'module',
      sourcemap: true,
      plugins: [terser()]
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
          'src/design/**/*.ts',
        ],
        paths: {
          'raport/*': ['src/lib/*'],
          'views/*': ['.views/views/*']
        },
        sourceMap: true,
      }),
      sourcemaps(),
      node(),
    ],
  });

  configs.push({
    input: 'src/play/index.ts',
    output: {
      file: 'play/index.min.js',
      format: 'iife',
      name: 'play',
      sourcemap: true,
    },
    plugins: [
      typescript({
        include: ['src/**/*.ts'],
      }),
      sourcemaps(),
      node(),
      terser(),
    ]
  });
}

export default configs;
