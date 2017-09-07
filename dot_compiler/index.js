'use strict'

const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const watchr = require('watchr')
const Dot = require('dot')
const _ = require('lodash')
const async = require('async')
const jsonfile = require('jsonfile')
const bs = require('browser-sync').create()

class Compiler {

  constructor (options) {
    let stalkerConfig = {
      stat: null,
      interval: 5007,
      persistent: true,
      catchupDelay: 2000,
      preferredMethods: ['watch', 'watchFile'],
      followLinks: true,
      ignorePaths: false,
      ignoreHiddenFiles: false,
      ignoreCommonPatterns: true,
      ignoreCustomPatterns: null
    }
    if (_.has(options, 'stalkerConfig') && !_.isEmpty(options.stalkerConfig)) {
      stalkerConfig = _.merge(stalkerConfig, options.stalkerConfig)
    }

    if (process.argv && process.argv[2] && process.argv[2] === 'prod') {
      options.webpack_command = 'npm run compile'
      options.compile = true
    }

    this.options = _.merge({
      source_path: './src',
      source_data: './src/data.json',
      source_view: 'views',
      dist_path: './dist',
      webpack_command: 'npm run webpack',
      log: true,
      compile: false,
      stalkerConfig
    }, _.omit(options, ['stalkerConfig']))

    convertGivenPathToAbsolutePath.call(this)

    initializeStalker.call(this)
  }

}

function convertGivenPathToAbsolutePath () {
  this.options.source_path = path.join(process.cwd(), this.options.source_path)
  this.options.dist_path = path.join(process.cwd(), this.options.dist_path)
  this.options.source_view_path = path.join(this.options.source_path, this.options.source_view)
}

function initializeStalker () {
  this.stalker = watchr.create(this.options.source_path)

  this.stalker.on('change', (changeType, changeFilePath) => {
    let fileDetail = path.parse(changeFilePath)
    let ext = fileDetail.ext
    if (ext === '.dot' || ext === '.def' || ext === '.json') {
      compileDotTemplate.call(this)
    } else if (ext === '.js' || ext === '.scss') {
      runBuildWithWebpack.call(this)
    } else {
      log.call(this, 'Unknown extension', ext)
    }
  })

  this.stalker.once('close', () => this.stalker.removeAllListeners())

  this.stalker.setConfig(this.options.stalkerConfig)

  this.stalker.watch(err => {
    if (err) {
      throw err
    } else {
      log.call(this, 'Watching directory', this.options.source_path)
      runBuildWithWebpack.call(this)

      if (this.options.compile === false) {
        bs.init({
          server: this.options.dist_path,
          open: false,
          reloadOnRestart: true
        })
      }
    }
  })
}

function runBuildWithWebpack () {
  let webpackDone = compileDotTemplate.bind(this)

  if (!_.isEmpty(this.options.webpack_command)) {
    let spawnWebpack = exec(this.options.webpack_command)
    spawnWebpack.stdout.on('data', message => log.call(this, message))
    spawnWebpack.on('close', webpackDone)
  } else {
    webpackDone()
  }
}

function compileDotTemplate () {
  Dot.log = this.options.log
  log.call(this, '===============================================')
  const dots = Dot.process({ path: this.options.source_view_path })
  createDataJSONForWebpackCompileResults.call(this)
    .then(data => {
      fs.readdir(this.options.source_view_path, (err, files) => {
        if (err) {
          throw err
        } else {
          async.each(files, function (file, callback) {
            processEachFiles.call(this, dots, file, data, callback)
          }.bind(this), err => {
            if (err) {
              throw err
            } else {
              log.call(this, 'Template compile successfully')
              if (this.options.compile === true) {
                process.exit()
              } else {
                bs.reload()
              }
            }
          })
        }
      })
    })
}

function processEachFiles (dots, file, data, callback) {
  let parsePath = path.parse(path.join(this.options.source_view_path, file))

  if (parsePath.ext === '.dot') {
    fs.writeFile(path.join(this.options.dist_path, `${parsePath.name}.html`), dots[parsePath.name](data), err => callback(err))
  } else {
    callback()
  }
}

function createDataJSONForWebpackCompileResults () {
  return new Promise(resolve => {
    async.auto({
      getFiles: cb => fs.readdir(this.options.dist_path, (err, files) => cb(err, files)),
      getJSONData: cb => jsonfile.readFile(this.options.source_data, (err, data) => cb(err, data))
    }, (err, results) => {
      if (err) {
        throw err
      } else {
        let data = results.getJSONData

        if (!_.has(data, 'css')) {
          data.css = []
        } else if (!_.has(data, 'js')) {
          data.js = []
        }

        async.each(results.getFiles, (file, callback) => {
          let ext = path.parse(path.join(this.options.dist_path, file)).ext
          if (ext === '.css' || ext === '.js') {
            if (data[ext === '.css' ? 'css' : 'js']) {
              data[ext === '.css' ? 'css' : 'js'].push(file)
            } else {
              data[ext === '.css' ? 'css' : 'js'] = [file]
            }
            callback()
          } else {
            callback()
          }
        }, () => resolve(data))
      }
    })
  })
}

function log (...args) {
  if (this.options.log === true) {
    console.log(...args)
  }
}

module.exports = (options = {}) => new Compiler(options)
