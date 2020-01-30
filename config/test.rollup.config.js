import sourcemaps from 'rollup-plugin-sourcemaps';

export default [{
  input: 'build/test/test/index.js',
  output: {
    file: 'build/test.js',
    format: 'umd',
    name: 'Raport',
    sourcemap: true
  },
  plugins: [
    sourcemaps()
  ]
}];

