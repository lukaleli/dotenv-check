#!/usr/bin/env node

const fs = require('fs')

/**
 * Maps command line parameters to the object
 * 
 * @param {any} [args=[]] 
* @returns Object
 */
const mapArgsToObject = (args = []) =>
  args
    .reduce((result, value, index, array) => {
      if (index % 2 === 0) result.push(array.slice(index, index + 2))
      return result
    }, [])
    .reduce((result, [key, value]) => {
      if (/--[a-z]+/.test(key)) {
        result[key.slice(2)] = true
        return result
      }
      if (/-[a-z]+/.test(key)) {
        result[key.slice(1)] = value
        return result
      }
      return result
    }, {})

const argv = mapArgsToObject(process.argv.slice(2))
const sourceFilePath = argv.s
const targetFilePath = argv.t
const SILENT_MODE = argv.silent
const TARGET_LINE_REGEX = /\w+=\w+/
const SOURCE_LINE_REGEX = /\w+=(\w+)?/

/**
 * Logging helper
 * 
 * @param {string} [msg=''] 
 */
const log = (msg = '') => {
  !SILENT_MODE && console.log(`[DOTENV CHECK] ${msg}`)
}

/**
 * Helper that checks provided boolean
 * and exits the script if false. 
 * Logs provided condition description
 * and any text on false (if provided)
 * 
 * @param {boolean} condition 
 * @param {string} [desc=''] 
 * @param {Function} logOnFalse 
 */
const exitIfFalse = (condition, desc = '', logOnFalse) => {
  if (!condition) {
    log(`if ${desc} \n NOPE \n`)
    logOnFalse && log(`[HINT]: ${logOnFalse}\n\n`)
    log('EXITING\n')
    process.exit(1)
  } else {
    log(`if ${desc} \n YUP \n`)
  }
}

/**
 * Tokenizes provided source file line
 * 
 * @param {string} [line=''] 
 * @returns Object
 */
const tokenizeSource = (line = '') => {
  const result = {}
  const [key, value] = line.split('=')
  result.key = key
  if (value) result.allowedValues = value.split('|')
  return result
}

/**
 * Tokenizes provided target file line
 * 
 * @param {string} [line=''] 
 * @returns Object
 */
const tokenizeTarget = (line = '') => {
  const result = {}
  const [key, value] = line.split('=')
  result.key = key
  result.value = value
  return result
}

/**
 * Checks if two arrays have same length
 * 
 * @param {any} [a=[]] 
 * @param {any} [b=[]] 
 * @returns boolean
 */
const isExactNumberOfLines = (a = [], b = []) => a.length === b.length

/**
 * Iterates collection of strings
 * and checks if they are matching 
 * provided regex and returns true or false
 * 
 * @param {Array<string>} collection 
 * @param {RegExp} regex 
 * @returns boolean
 */
const areLinesMatchingRegex = (collection, regex) =>
  collection.reduce((result, element) => {
    if (!regex.test(element)) return false
    return result
  }, true)

/**
 * Checks if provided value matches
 * one of the values in the array
 * 
 * @param {any} [allowedValues=[]] 
 * @param {string} [value=''] 
 * @returns boolean
 */
const doesContainAllowedValue = (allowedValues = [], value = '') => {
  if (!allowedValues.length && value === '') return true
  const regex = allowedValues.map(value => `^${value}$`).join('|')
  return new RegExp(`(${regex})`).test(value)
}

// Check if source file path was provided
if (!sourceFilePath) {
  log('Please provide source file path with -s argument')
  process.exit(1)
}

// Check if target file path was provided
if (!targetFilePath) {
  log('Please provide target file path with -t argument')
  process.exit(1)
}

// Check if source file exists
if (!fs.existsSync(sourceFilePath)) {
  log(`Source file (${sourceFilePath}) doesn't exist`)
  process.exit(1)
}

// Check if target file exists
if (!fs.existsSync(targetFilePath)) {
  log(`Target file (${targetFilePath}) doesn't exist`)
  process.exit(1)
}

log(`\n\nComparing ${targetFilePath} against ${sourceFilePath}\n\n`)

// Split both files into lines
const sourceLines = fs.readFileSync(sourceFilePath, 'utf8').split('\n')
const targetLines = fs.readFileSync(targetFilePath, 'utf8').split('\n')

// Check if arrays have the same length
exitIfFalse(
  isExactNumberOfLines(sourceLines, targetLines),
  'source and target files have the same number of lines',
  'Source and target files should have the same number of declared variables. Double check it!'
)

// Check if source file is properly formated
exitIfFalse(
  areLinesMatchingRegex(sourceLines, SOURCE_LINE_REGEX),
  'source env lines match <KEY>=<?ALLOWED_VALUES> pattern',
  'Check variables declaration in your source file. They should match <KEY>=<?ALLOWED_VALUES> pattern'
)

// Check if target file is properly formated
exitIfFalse(
  areLinesMatchingRegex(targetLines, TARGET_LINE_REGEX),
  'target env lines match <KEY>=<VALUE> pattern',
  'Check variables declaration in your target file. They should match <KEY>=<VALUE> pattern'
)

// Tokenize both arrays
const tokenizedSourceVars = sourceLines.map(tokenizeSource)
const tokenizedTargetVars = targetLines.map(tokenizeTarget)

// Compare source file tokens with target file tokens
tokenizedSourceVars.forEach(({ key, allowedValues }) => {
  const targetKeyIndex = tokenizedTargetVars.findIndex(el => el.key === key)
  exitIfFalse(targetKeyIndex !== -1, `target has key: $${key}`)
  const targetToken = tokenizedTargetVars[targetKeyIndex]
  if (!allowedValues) return
  exitIfFalse(
    doesContainAllowedValue(allowedValues, targetToken.value),
    `target key $${key} equals one of the following values: ${allowedValues.join(
      ' | '
    )}`,
    `$${key} in your target env file must match one of these values: 
    ${allowedValues.map(x => `\n   * ${x}\n`).join('')}
    Current value is: ${targetToken.value}  
    `
  )
})

log('SUCCESS!')
log(`${targetFilePath} matches ${sourceFilePath}`)
process.exit(0)
