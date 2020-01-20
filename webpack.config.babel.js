import path from 'path'

import TerserPlugin from 'terser-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import autoprefixer from 'autoprefixer'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'

const common = {
  mode,
  module: {
    rules: [
      {
        test: /\.js(on|x)?$/,
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
    'monochord.min': [
      '@babel/polyfill',
      './src/client/js/lib/webkit-audio-context-patch.min.js',
      // './src/client/js/lib/cancelandholdattime-polyfill.min.js',
      './src/client/index.jsx'
    ]
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
    })
  ],
  ...common
}

const serverConfig = {
  mode,
  target: 'node',
  externals: [nodeExternals()],
  entry: {
    'server.min': ['./src/server/index.jsx']
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
