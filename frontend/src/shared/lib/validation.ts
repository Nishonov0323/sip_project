/** Backend (`schemas/call.py`) dagi NUMBER_PATTERN bilan bir xil bo'lishi kerak. */
export const NUMBER_PATTERN = /^[0-9*#+]{2,32}$/
export const NUMBER_PATTERN_ATTR = '[0-9*#+]{2,32}'

export const isValidNumber = (value: string) => NUMBER_PATTERN.test(value)
export const sanitizeNumber = (value: string) => value.replace(/[^0-9*#+]/g, '')
