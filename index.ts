import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import { Font } from './types.d'
const parse = require('xml2js').parseStringPromise
const pathParse = require('svg-path-parser').parseSVG

const svg = function(d, w, h) {
  return (
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<path d="${d}" />
</svg>
`)
}

function offset(path, dx, dy) {
  return path.map(command => {
    if (command.code === 'M') {
      const { x, y } = command
      return { ...command, x: x + dx, y: y + dy }
    }
    return command
  })
}

function flipX(path, h) {
  const m = h / 2

  return path
    .map(command => {
      const { x, y, x1, y1, x2, y2 } = command

      switch (command.code) {
        case 'c': return ['c', x1, -y1, x2, -y2, x, -y ]
        case 'M': return ['M', x, y + 2*(m - y)]
        case 'v': return ['v', -y]
        case 'h': return ['h', x]
        case 'Z': return ['Z']
        case 'l': return ['l', x, -y]
        case 's': return ['s', x2, -y2, x, -y]
        default:
          throw new Error('Not recognized command.code = ' + command.code)
      }
    })
    .map(command => command.join(' '))
}

async function read(xml) {
  const tree = await parse(xml)
  const $font = tree.svg.defs[0].font[0]

  const font: Font = {
    ...$font.$,
    "font-face": $font['font-face'][0].$,
    glyphs: $font.glyph.map(x => x.$)
  }

  return font
}

async function batch(filename) {
  const font = await read(fs.readFileSync(filename))

  // const [min_x, min_y] = font["font-face"].bbox.split(' ').map(x => Number(x))
  // const dx = -Math.round(min_x)

  const dx = 0
  const dy = -Number(font["font-face"].descent)
  const h = Number(font["font-face"].ascent) - Number(font["font-face"].descent)

  const dir = path.join('output', path.basename(filename, path.extname(filename)))
  try { fs.mkdirSync(dir, { recursive: true }) } catch {}
  
  for (const glyph of font.glyphs) {
    const p = pathParse(glyph.d)
    const _ = offset(p, dx, dy)
    const d = flipX(_, h).join(' ')
    const w = glyph["horiz-adv-x"] || font["horiz-adv-x"]

    const f = path.join(dir, glyph["glyph-name"] + '.svg')
    fs.writeFileSync(f, svg(d, w, h))
  }
}
  
(async () => {
  const files = process.argv.slice(2)
  if (files.length === 0) {
    console.error("No input file")
    process.exit(1)
  }

  const pros = files.map(x => batch(x))
  await Promise.all(pros)
})()
