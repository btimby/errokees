// https://webpack.js.org/guides/author-libraries/

import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
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
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    compress: true,
    hot: true,
    host: '127.0.0.1',
    port: 3001,
    static: {
      directory: "demo/",
    },
  },
};
