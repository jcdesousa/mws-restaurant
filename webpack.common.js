const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './src/js/main.js',
    restaurantInfo: './src/js/restaurant_info.js',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: true,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        }],
      },
      {
        test: /\.(gif|png|jpe?g)$/i,
        use: [
          {
            loader: 'responsive-loader',
            options: {
              sizes: [100, 300, 600],
            },
          }],
      },
      {
        test: /heart.svg$/,
        use: [
          { loader: 'svg-inline-loader' },
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name][hash].[ext]',
          },
        },
        exclude: /heart\.svg$/,
      }],
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: true,
      chunks: ['main'],
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/restaurant.html',
      inject: true,
      chunks: ['restaurantInfo'],
      filename: 'restaurant.html',
    }),
  ],
};
