# Bizsaya Portal

Source code for bizsaya main portal [https://bizsaya.com](https://bizsaya.com).

Using [dot template](http://olado.github.io/doT/index.html) as template to be compile to standard HTML5.

Hybrid with [webpack](https://webpack.js.org/) to compile the assets (scss, javascript)

All image is hosted on google cloud storage

### Stack 
- Only nodejs

### Hosting
- Google firebase
- Google cloud storage

### Testing
- [wdio](http://webdriver.io)
- mocha
- chai

### Some information
- Dynamic data is stored on `./src/data.json`
- Using [watchr](https://github.com/bevry/watchr) to watch the directory, and trigger any usage to webpack when scss or js file is change (view `./dot_compiler/index.js`)

### License 
MIT

Develop by
Edi Abdul Rahman <eddytech03@gmail.com>