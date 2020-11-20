import typescript from '@rollup/plugin-typescript';
import sourcemaps from 'rollup-plugin-sourcemaps';
import node from '@rollup/plugin-node-resolve';

export default [{
  input: 'test/index.ts',
  output: {
    file: 'build/test.js',
    format: 'umd',
    name: 'Raport',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: 'test.tsconfig.json'
    }),
    sourcemaps(),
    node(),
  ],
}];

