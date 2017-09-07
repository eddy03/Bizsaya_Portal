'use strict'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const _MAIN_SOURCE = path.resolve(__dirname, 'src', 'resources', 'index.js')
const _MAIN_SHEET_SOURCE = path.resolve(__dirname, 'src', 'resources', 'sheets.js')
const _DIST_PATH = path.resolve(__dirname, 'dist')

module.exports = function (env) {

	let jsFilename = '[name].js'
	let cssFilename = '[name].css'
  if(env === 'prod') {
	jsFilename = '[name]-[hash].min.js'
	cssFilename = 'app-[hash].min.css'
  }

  const extractSass = new ExtractTextPlugin({
    filename: cssFilename,
    allChunks: true
  })

  let plugins = [

    new CleanWebpackPlugin([_DIST_PATH], {
      root: path.join(__dirname),
      verbose: true,
      dry: false
    }),

    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),

    extractSass,

    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: 'popper.js'
    })


  ]

  if(env === 'prod') {
    plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        output: {
          comments: false
        }
      })
    )
  }

  return {
    entry: {
      main: _MAIN_SOURCE,
      sheet: _MAIN_SHEET_SOURCE
    },
    output: {
      filename: jsFilename,
      path: _DIST_PATH,
      sourceMapFilename: '[name]-[hash].map'
    },
    module: {
      rules: [{
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
            { loader: 'css-loader' },
            { loader: 'sass-loader' }
          ],
          fallback: 'style-loader'
        })
      }, {
        test: /\.css/,
        use: 'css-loader'
      }]
    },
    plugins,
    devtool: env === 'prod'? 'none' : 'inline-source-map'
  }
}