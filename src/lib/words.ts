const ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function two(n: number): string {
  if (n < 20) return ONES[n]
  const t = Math.floor(n / 10)
  const o = n % 10
  return TENS[t] + (o ? ' ' + ONES[o] : '')
}

function three(n: number): string {
  const h = Math.floor(n / 100)
  const rest = n % 100
  const hPart = h ? ONES[h] + ' Hundred' : ''
  const rPart = rest ? two(rest) : ''
  return [hPart, rPart].filter(Boolean).join(' ')
}

/**
 * Convert a money amount into cheque-style words.
 * Uses the lakh/crore system (Pakistan / South Asia).
 *
 *   amountToWords(45000)    -> "Rupees Forty Five Thousand Only"
 *   amountToWords(45000.5)  -> "Rupees Forty Five Thousand and Fifty Paise Only"
 */
export function amountToWords(amount: number): string {
  const paise = Math.round(Math.round((amount - Math.floor(amount)) * 100) % 100)
  const whole = Math.floor(amount)

  const crore = Math.floor(whole / 10000000)
  const lakh = Math.floor((whole % 10000000) / 100000)
  const thousand = Math.floor((whole % 100000) / 1000)
  const rest = whole % 1000

  const parts: string[] = []
  if (crore) parts.push(three(crore) + ' Crore')
  if (lakh) parts.push(three(lakh) + ' Lakh')
  if (thousand) parts.push(three(thousand) + ' Thousand')
  if (rest) parts.push(three(rest))

  const words = parts.join(' ') || (whole === 0 ? ONES[0] : '')

  let result = 'Rupees ' + words
  if (paise) {
    result += ' and ' + two(paise) + ' Paise'
  }
  return result + ' Only'
}