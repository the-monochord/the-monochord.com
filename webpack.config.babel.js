import path from 'path'

import TerserPlugin from 'terser-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import autoprefixer from 'autoprefixer'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import CopyPlugin from 'copy-webpack-plugin'

const minifyJSON = rawJSON => JSON.stringify(JSON.parse(rawJSON))

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'

const common = {
  mode,
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          compact: false
        }
      },
      {
        test: /\.s?css$/,
        exclude: [/node_modules/],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer]
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.s?css$/,
        include: [/node_modules/],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer]
            }
          },
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.scss', '.css']
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: false,
        parallel: true,
        sourceMap: true
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  devtool: mode === 'production' ? 'none' : 'cheap-module-eval-source-map'
}

const clientConfig = {
  entry: {
    monochord: ['regenerator-runtime/runtime', 'cancelandholdattime-polyfill', './src/client/index.jsx']
  },
  output: {
    path: path.resolve(__dirname, 'static-cdn'),
    filename: 'js/[name].js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new webpack.BannerPlugin({
      banner: 'The Monochord - created by Lajos Meszaros <m_lajos@hotmail.com>'
    }),
    // https://github.com/webpack/webpack/issues/2537#issuecomment-263630802
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.DefinePlugin({
      __isBrowser__: 'true'
    }),
    new CopyPlugin([
      {
        from: './src/common/i18n/*.json',
        to: path.resolve(__dirname, 'static-cdn/i18n/[name].json'),
        toType: 'template',
        transform: contentBuffer => minifyJSON(contentBuffer.toString())
      }
    ])
  ],
  ...common
}

const serverConfig = {
  target: 'node',
  externals: [nodeExternals()],
  entry: {
    server: ['regenerator-runtime/runtime', './src/server/index.js']
  },
  output: {
    path: path.resolve(__dirname, 'app'),
    filename: 'js/[name].js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    // https://github.com/webpack/webpack/issues/2537#issuecomment-263630802
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.DefinePlugin({
      __isBrowser__: 'false'
    })
  ],
  node: {
    __dirname: false
  },
  ...common
}

export default [serverConfig, clientConfig]
