import sourcemaps from 'rollup-plugin-sourcemaps';
import node from '@rollup/plugin-node-resolve';

export default [{
  input: 'build/test/test/index.js',
  output: {
    file: 'build/test.js',
    format: 'umd',
    name: 'Raport',
    sourcemap: true
  },
  plugins: [
    sourcemaps(),
    node(),
  ],
}];

