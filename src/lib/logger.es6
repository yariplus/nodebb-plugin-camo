const winston = require.main.require('winston')

const prefixes = {
  C  : '[Camo]: ',
  CP : '[CamoProxy]: '
}

const info = (prefix, msg) => {
  winston.info(prefixes[prefix] + msg)
}

const warn = (prefix, msg) => {
  winston.warn(prefixes[prefix] + msg)
}

export { info, warn }
