'use strict'

const path = require('path')
const fs = require('fs')
const watchr = require('watchr')
const dot = require('dot')
const async = require('async')

const workingDir = path.join(__dirname, 'resources', 'views')

const stalker = watchr.create(workingDir)

stalker.on('change', listener)
stalker.once('close', function (reason) {
  console.log('closed', workingDir, 'because', reason)
  stalker.removeAllListeners()  // as it is closed, no need for our change or log listeners any more
})

stalker.setConfig({
  stat: null,
  interval: 5007,
  persistent: true,
  catchupDelay: 2000,
  preferredMethods: ['watch', 'watchFile'],
  followLinks: true,
  ignorePaths: false,
  ignoreHiddenFiles: true,
  ignoreCommonPatterns: true,
  ignoreCustomPatterns: null
})

// Start watching
stalker.watch(err => {
  if(err) {
    console.error('Error', err)
  } else {
    console.log('Watching ', workingDir)
  }
})

function listener (changeType, fullPath, currentStat, previousStat) {

  const dirs = fs.readdirSync(workingDir)

  async.each(dirs, (dir, callback) => {
    console.log(dir)
  })

}

listener()