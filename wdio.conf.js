'use strict'

const _ = require('lodash')
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')
const fs = require('fs')
const mime = require('mime')

exports.config = {
  specs: ['./test/index.js'],
  exclude: [],
  maxInstances: 1, // it depends on the plan of the cloud servvice
  sync: true,
  logLevel: 'error',
  coloredLogs: true,
  waitforTimeout: 20000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  screenshotPath: 'shots',
  mochaOpts: {
    ui: 'bdd',
    timeout: 30000
  },
  capabilities: [{
    browserName: 'phantomjs'
  }],
  services: ['phantomjs'],
  baseUrl: 'http://localhost:3000',
  onPrepare: function () {
    return new Promise((resolve, reject) => {

      if(process.argv && process.argv[2] === '--compile') {
        console.log('================COMPILE TO DIST================')
        let compiler = spawn('node', ['index.js', 'prod'])

        compiler.stdout.on('data', (data) => {
          console.log(_.trim(data.toString()))
          if(_.trim(data.toString()) === 'Template compile successfully') {
            console.log('================BOOTUP SERVER================')

            let server = http.createServer((req, res) => {
              if(req.url === '/') {
                sendFile(res, 'index.html')
              } else {
                sendFile(res, _.trim(req.url, '/'))
              }
            })

            server.listen(3000, () => {
              console.log('================BEGIN TEST================')
              resolve()
            })

          }
        })

        compiler.stderr.on('data', () => reject(new Error('Error bootup server')))
      } else {
        let server = http.createServer((req, res) => {
          if(req.url === '/') {
            sendFile(res, 'index.html')
          } else {
            sendFile(res, _.trim(req.url, '/'))
          }
        })

        server.listen(3000, () => resolve())
      }

    })
  }
}


function sendFile(res, file) {

  file = path.join(__dirname, 'dist', file)

  fs.stat(file, err => {

    if(err) {
      res.writeHead(404)
      res.end()
    } else {
      res.setHeader('Content-Type', mime.lookup(file))
      res.end(fs.readFileSync(file))
    }

  })

}