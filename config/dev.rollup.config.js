import sourcemaps from 'rollup-plugin-sourcemaps';

export default [{
  input: 'build/play/index.js',
  output: {
    file: 'play/index.js',
    format: 'iife'
  },
  watch: { clearScreen: false }
}, {
  input: 'build/lib/index.js',
  output: {
    file: 'build/lib/raport.umd.js',
    format: 'umd',
    name: 'Raport',
    sourcemap: true
  },
  plugins: [
    sourcemaps()
  ],
  watch: { clearScreen: false }
}];
