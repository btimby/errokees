// https://webpack.js.org/guides/author-libraries/

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  mode: 'none',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'Errokees',
    libraryTarget: 'umd',
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: 'demo/index.html',
      scriptLoading: 'blocking',
    })
  ],
  devServer: {
    compress: true,
    hot: true,
    host: '127.0.0.1',
    port: 3000,
    static: {
      directory: "demo/",
    },
  },
};
