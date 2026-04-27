const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: path.resolve(__dirname, 'src', 'index.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: {
        '@nasnet/ui': path.resolve(__dirname, 'src', 'ui'),
        '@nasnet/mocks': path.resolve(__dirname, 'src', 'mocks'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.module\.scss$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                esModule: false,
                modules: {
                  namedExport: false,
                  exportLocalsConvention: 'as-is',
                  localIdentName: isProduction
                    ? '[hash:base64:6]'
                    : '[name]__[local]__[hash:base64:4]',
                },
                importLoaders: 1,
              },
            },
            'sass-loader',
          ],
        },
        {
          test: /\.scss$/,
          exclude: /\.module\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __BACKEND_URL__: JSON.stringify(backendUrl),
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public', 'index.html'),
        title: 'Nasnet Panel',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'public'),
            to: path.resolve(__dirname, 'dist'),
            globOptions: { ignore: ['**/index.html'] },
          },
        ],
      }),
    ],
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    performance: { hints: false },
    devServer: {
      historyApiFallback: true,
      port: Number(process.env.PORT || 3000),
      host: '0.0.0.0',
      hot: true,
      client: { overlay: { errors: true, warnings: false } },
      static: [
        {
          directory: path.resolve(__dirname, 'public'),
          publicPath: '/',
        },
      ],
    },
  };
};
