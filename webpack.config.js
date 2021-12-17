const { resolve } = require('path');

module.exports = {
  entry: resolve(__dirname, 'src/index.ts'),
  output: {
    library: 'FrontPeekLogger',
    filename: 'index.js',
    libraryTarget: 'umd',
    path: resolve(__dirname, 'dist')
  },
  devtool: 'source-map',
  resolve: {
    extensions: [
      '.ts',
      '.js'
    ]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'awesome-typescript-loader'
      }
    ]
  }
};