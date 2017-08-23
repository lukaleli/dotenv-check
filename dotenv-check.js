#!/usr/bin/env node

const fs = require('fs')

const mapArgsToObject = (args = []) =>
  args
    .reduce((result, value, index, array) => {
      if (index % 2 === 0) result.push(array.slice(index, index + 2))
      return result
    }, [])
    .reduce((result, [key, value]) => {
      if (/-[a-zA-Z]+/.test(key)) {
        result[key.slice(1)] = value
      }
      return result
    }, {})

const argv = mapArgsToObject(process.argv.slice(2))
const exampleFilePath = argv.s
const targetFilePath = argv.t
const TARGET_LINE_REGEX = /\w+=\w+/
const EXAMPLE_LINE_REGEX = /\w+=(\w+)?/

const log = (msg = '') => {
  console.log(`[DOTENV CHECK] ${msg}`)
}

if (!exampleFilePath) {
  log('Please provide source file with -s argument')
  process.exit(1)
}

if (!targetFilePath) {
  log('Please provide target file with -t argument')
  process.exit(1)
}

if (!fs.existsSync(exampleFilePath)) {
  log("Source env file doesn't exist")
  process.exit(1)
}

if (!fs.existsSync(targetFilePath)) {
  log("Target env file doesn't exist")
  process.exit(1)
}

log(
  `\n\n<<<<<< Comparing ${targetFilePath} against ${exampleFilePath} >>>>>>\n\n`
)

const exitIfFalse = (condition, desc = '') => {
  if (!condition) {
    log(`if ${desc} \n NOPE \n`)
    log('EXITING\n')
    process.exit(1)
  } else {
    log(`if ${desc} \n YUP \n`)
  }
}

const tokenizeExample = (line = '') => {
  const result = {}
  const [key, value] = line.split('=')
  result.key = key
  if (value) {
    result.allowedValues = value.split('|')
  }
  return result
}

const tokenizeTarget = (line = '') => {
  const result = {}
  const [key, value] = line.split('=')
  result.key = key
  result.value = value
  return result
}

const checkIfExactLinesNumber = (a = [], b = []) => a.length === b.length

const areLinesMatchingRegex = (collection, regex) =>
  collection.reduce((result, element) => {
    if (!regex.test(element)) {
      return false
    }
    return result
  }, true)

const checkIfContainsAllowedValue = (values = [], currentValue = '') => {
  if (values.length === 0 && currentValue === '') return true
  const regex = values.map(value => `^${value}$`).join('|')
  return new RegExp(`(${regex})`).test(currentValue)
}

const exampleLines = fs.readFileSync(exampleFilePath, 'utf8').split('\n')
const targetLines = fs.readFileSync(targetFilePath, 'utf8').split('\n')

exitIfFalse(
  checkIfExactLinesNumber(exampleLines, targetLines),
  'example and target files have the same number of lines'
)

exitIfFalse(
  areLinesMatchingRegex(exampleLines, EXAMPLE_LINE_REGEX),
  'example env lines match <KEY>=<?VALUE> pattern'
)

exitIfFalse(
  areLinesMatchingRegex(targetLines, TARGET_LINE_REGEX),
  'target env lines match <KEY>=<VALUE> pattern'
)

const parsedExampleTokens = exampleLines.map(tokenizeExample)
const parsedTargetTokens = targetLines.map(tokenizeTarget)

parsedExampleTokens.forEach(({ key, allowedValues }) => {
  const targetKeyIndex = parsedTargetTokens.findIndex(el => el.key === key)
  exitIfFalse(targetKeyIndex !== -1, `target has key: $${key}`)
  const targetToken = parsedTargetTokens[targetKeyIndex]
  if (allowedValues) {
    exitIfFalse(
      checkIfContainsAllowedValue(allowedValues, targetToken.value),
      `target key $${key} equals one of the following values: ${allowedValues.join(
        ' | '
      )}`
    )
  }
})

log('SUCCESS!')
log(`${targetFilePath} matches ${exampleFilePath}`)
process.exit(0)
