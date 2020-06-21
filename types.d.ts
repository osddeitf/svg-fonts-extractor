
export interface Font {
  id: string
  'horiz-adv-x': string
  'font-face': FontFace
  'glyphs': Glyph[]
}

export interface FontFace {
  'font-family': string
  'font-weight': string
  'font-stretch': string
  'units-per-em': string
  'panose-1': string
  'ascent': string
  'descent': string
  'bbox': string
  'underline-thickness': string
  'underline-position': string
  'unicode-range': string
}

export interface Glyph {
  'glyph-name': string
  unicode: string
  d: string
  'horiz-adv-x'?: string
}
