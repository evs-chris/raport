import sourcemaps from 'rollup-plugin-sourcemaps';
import node from '@rollup/plugin-node-resolve';

export default [{
  input: 'build/play/index.js',
  output: {
    file: 'play/index.js',
    format: 'iife'
  },
  watch: { clearScreen: false },
  plugins: [
    node(),
  ],
}, {
  input: 'build/lib/index.js',
  output: {
    file: 'build/lib/raport.umd.js',
    format: 'umd',
    name: 'Raport',
    sourcemap: true
  },
  plugins: [
    sourcemaps(),
    node(),
  ],
  watch: { clearScreen: false }
}];
