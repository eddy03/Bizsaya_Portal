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

    // Default stalker Config
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

    // If options was pass with stalkerConfig, merge it with default value
    if (_.has(options, 'stalkerConfig') && !_.isEmpty(options.stalkerConfig)) {
      stalkerConfig = _.merge(stalkerConfig, options.stalkerConfig)
    }

    // If we going to compile on production
    if (process.argv && process.argv[2] && process.argv[2] === 'prod') {
      options.webpack_command = 'npm run compile'
      options.compile = true
    }

    // Base options - merge with parameters options
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

/**
 * Convert the path to absolute path to reduce pening kepala
 *
 */
function convertGivenPathToAbsolutePath () {
  this.options.source_path = path.join(process.cwd(), this.options.source_path)
  this.options.dist_path = path.join(process.cwd(), this.options.dist_path)
  this.options.source_view_path = path.join(this.options.source_path, this.options.source_view)
}

/**
 * Bootup stalker
 *
 */
function initializeStalker () {
  this.stalker = watchr.create(this.options.source_path)

  this.stalker.on('change', (changeType, changeFilePath) => {
    let fileDetail = path.parse(changeFilePath)
    let ext = fileDetail.ext

    if (ext === '.dot' || ext === '.def' || ext === '.json') {
      compileDotTemplate.call(this)               // .dot, .def, .json wont require webpack to recompile. run tru dot template only
    } else if (ext === '.js' || ext === '.scss') {
      runBuildWithWebpack.call(this)              // but .js and .scss require webpack to recompile it, So spawn those webpack to compile it first
    } else {
      log.call(this, 'Unknown extension', ext)    // Demm.. we got some garbage file
    }
  })

  this.stalker.once('close', () => this.stalker.removeAllListeners())

  this.stalker.setConfig(this.options.stalkerConfig)

  this.stalker.watch(err => {
    if (err) {
      throw err
    } else {
      log.call(this, 'Watching directory', this.options.source_path)

      // At first, we always recompile tru webpack first
      runBuildWithWebpack.call(this)

      // Not running as production compile? then bootup browser-sync
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

/**
 * Compile .js and .scss files tru webpack. Spawn and then die..
 *
 */
function runBuildWithWebpack () {
  let webpackDone = compileDotTemplate.bind(this)

  if (!_.isEmpty(this.options.webpack_command)) {                         // If webpack command is empty.. do nothing..
    let spawnWebpack = exec(this.options.webpack_command)                 // spawn webpack.. come and serve for me!
    spawnWebpack.stdout.on('data', message => log.call(this, message))    // Show some output. so we know what happen there.
    spawnWebpack.on('close', webpackDone)                                 // webpack dead.. might be finish compile, go to next step!
  } else {
    webpackDone()                                                         // .....
  }
}

/**
 * Compile for dot template
 *
 */
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
              if (this.options.compile === true) {      // We on production compile.. go die.
                process.exit()
              } else {                                  // Tell browsersync to reload the page
                bs.reload()
              }
            }
          })
        }
      })
    })
}

/**
 * Get the dot template compile template
 * Inject the data inside it
 * write the file as .html only for .dot file
 *
 * @param dots
 * @param file
 * @param data
 * @param callback
 */
function processEachFiles (dots, file, data, callback) {
  let parsePath = path.parse(path.join(this.options.source_view_path, file))

  if (parsePath.ext === '.dot') {
    fs.writeFile(path.join(this.options.dist_path, `${parsePath.name}.html`), dots[parsePath.name](data), err => callback(err))
  } else {
    callback()
  }
}

/**
 * Read all the webpack compile files..
 * Read the main dynamic data from json
 * then push it to dot template data object
 *
 * @return {Promise}
 */
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

/**
 * console.log somthing?
 *
 * @param args
 */
function log (...args) {
  if (this.options.log === true) {
    console.log(...args)
  }
}

module.exports = (options = {}) => new Compiler(options)
