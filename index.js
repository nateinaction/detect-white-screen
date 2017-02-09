import getPixels from 'get-pixels'
import Pageres from 'pageres'
import emoji from 'node-emoji'
import chalk from 'chalk'
import fs from 'fs'

const imageDir = __dirname + '/images/'
const hostname = process.argv[2] || null

const consoleMessage = (message, status) => {
  let color = 'yellow'
  let icon = ''
  if (status === 'success') {
    color = 'green'
    icon = emoji.get('thumbsup')
  } else if (status === 'error') {
    color = 'red'
    icon = emoji.get('thumbsdown')
  }
  console.log(chalk.bold[color](message) + ' ' + icon)
}

const deleteScreenshot = (filename) => {
  fs.unlink(imageDir + filename, () => {
    console.log('Screenshot deleted')
  })
}

const readPixelData = (filename) => {
  getPixels(__dirname + '/images/' + filename, function(err, pixels) {
    if (err) return console.error('Bad image path')
    console.log('Reading screenshot pixel data')

    let pixelData = new Map(Object.entries(pixels.data))
    let mapSize = pixelData.size
    for (var [position, color] of pixelData.entries()) {
      if (color !== 255) {
        deleteScreenshot(filename)
        consoleMessage('Webpage does not have white screen of death', 'success')
        return
      }

      if (position === (mapSize - 1).toString()) {
        deleteScreenshot(filename)
        consoleMessage('Webpage may have white screen of death', 'error')
        return
      }
    }
  })
}

const fetchScreenshot = (hostname) => {
  const pageresConfig = {
    delay: 2,
    crop: true,
    filename: '<%= url %>-<%= date %>-<%= time %>'
  }

  const pageres = new Pageres(pageresConfig)
      .src(hostname, ['640x360'])
      .dest(__dirname + '/images')
      .on('warning', (message) => {
        consoleMessage(message, 'warn')
      })
      .run(console.log('Generating webpage screenshot'))
      .then((data) => {
        let filename = data[0].filename
        readPixelData(filename)
      })
}

/*
 * Initialize
 */
if (hostname) {
  fetchScreenshot(hostname)
} else {
  consoleMessage('No hostname provided', 'warn')
}
