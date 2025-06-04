// Serbian number to words conversion
const units = [
  "",
  "jedan",
  "dva",
  "tri",
  "četiri",
  "pet",
  "šest",
  "sedam",
  "osam",
  "devet",
  "deset",
  "jedanaest",
  "dvanaest",
  "trinaest",
  "četrnaest",
  "petnaest",
  "šesnaest",
  "sedamnaest",
  "osamnaest",
  "devetnaest",
]

const tens = [
  "",
  "",
  "dvadeset",
  "trideset",
  "četrdeset",
  "pedeset",
  "šezdeset",
  "sedamdeset",
  "osamdeset",
  "devedeset",
]

const scales = ["", "hiljada", "milion", "milijarda", "bilion"]

function convertLessThanOneThousand(number: number): string {
  let result = ""

  if (number % 100 < 20) {
    result = units[number % 100]
    number = Math.floor(number / 100)
  } else {
    result = units[number % 10]
    number = Math.floor(number / 10)

    result = result ? tens[number % 10] + result : tens[number % 10]
    number = Math.floor(number / 10)
  }

  if (number === 0) return result
  return `${units[number]}sto${result}`
}

export function numberToWords(number: number): string {
  if (number === 0) return "nula"

  // Handle negative numbers
  const prefix = number < 0 ? "minus " : ""
  number = Math.abs(number)

  // Split into integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = Math.round((number - integerPart) * 100)

  let result = ""
  let scaleIndex = 0
  let start = integerPart

  while (start > 0) {
    const chunk = start % 1000

    if (chunk !== 0) {
      const chunkName = convertLessThanOneThousand(chunk)

      // Handle grammatical gender for thousands in Serbian
      const scaleName = scales[scaleIndex]
      if (scaleIndex === 1) {
        // thousands
        if (chunk === 1) {
          result = `hiljadu${result}`
        } else if (chunk >= 2 && chunk <= 4) {
          result = `${chunkName}hiljade${result}`
        } else {
          result = `${chunkName}${scaleName}${result}`
        }
      } else if (scaleIndex > 0) {
        if (chunk === 1) {
          result = `${scales[scaleIndex]}${result}`
        } else if (chunk >= 2 && chunk <= 4) {
          result = `${chunkName}${scales[scaleIndex]}a${result}`
        } else {
          result = `${chunkName}${scales[scaleIndex]}a${result}`
        }
      } else {
        result = chunkName + result
      }
    }

    start = Math.floor(start / 1000)
    scaleIndex++
  }

  // Add decimal part if exists
  if (decimalPart > 0) {
    result = `${result}dinara I ${decimalPart}/100`
  } else {
    result = `${result}dinara I 00/100`
  }

  return prefix + result
}
