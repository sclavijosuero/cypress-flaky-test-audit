const calcDisplay: HTMLInputElement | null =
	document.querySelector('#calc-display')

// Calculator state variables
let currentValue: string = '0'
let previousValue: string = ''
let operator: string = ''
let isNewEntry: boolean = true
const MAX_LENGTH: number = 10

/**
 * Update the display in the calculator using the given value.
 * @param value The value to display on the calculator screen.
 */
function updateDisplay(value: string): void {
	if (calcDisplay) {
		calcDisplay.value = value
	}
}

/**
 * Handle number input for the calculator.
 * @param num The number character to input.
 */
function inputNumber(num: string): void {
	// Prevent multiple leading zeros before decimal
	if (currentValue === '0' && num === '0') {
		// Do nothing
		return
	} else if (isNewEntry) {
		if (num === '0') {
			currentValue = '0'
		} else {
			currentValue = num
			isNewEntry = false
		}
	} else if (calcDisplay && calcDisplay.value === 'Error') {
		// Do nothing on error
		console.log('Calculator in error state, ignoring input.')
		return
	} else if (currentValue.length < MAX_LENGTH) {
		currentValue += num
	}
	updateDisplay(currentValue)
}

/**
 * Handle decimal point input for the calculator.
 */
function inputDecimal(): void {
	if (isNewEntry) {
		currentValue = '0.'
		isNewEntry = false
	} else if (!currentValue.includes('.') && currentValue.length < MAX_LENGTH) {
		currentValue += '.'
	}
	updateDisplay(currentValue)
}

/**
 * Handle operator input for the calculator.
 * @param op The operator character to input.
 */
function inputOperator(op: string): void {
	if (currentValue !== 'Error') {
		if (operator && !isNewEntry) {
			calculate()
			updateDisplay(currentValue)
		}

		if (currentValue !== 'Error') {
			previousValue = currentValue
			operator = op
			isNewEntry = true
		} else {
			previousValue = ''
			operator = ''
			isNewEntry = true
		}
	}
}

/**
 * Change the sign of the current value.
 */
function changeSign(): void {
	if (currentValue !== 'Error') {
		if (currentValue.startsWith('-')) {
			currentValue = currentValue.slice(1)
		} else if (currentValue.length < MAX_LENGTH) {
			currentValue = '-' + currentValue
		}
		updateDisplay(currentValue)
	}
}

/**
 * Clear all calculator state and reset display.
 */
function clearAll(): void {
	currentValue = '0'
	previousValue = ''
	operator = ''
	isNewEntry = true
	updateDisplay(currentValue)
}

/**
 * Clear the current entry in the calculator.
 */
function clearEntry(): void {
	currentValue = '0'
	isNewEntry = true
	updateDisplay(currentValue)
}

/**
 * Perform the calculation based on the previous value, current value, and operator.
 */
function calculate(): void {
	let result: number = 0
	let resultStr: string
	const prev: number = parseFloat(previousValue)
	const curr: number = parseFloat(currentValue)
	switch (operator) {
		case '+':
			result = prev + curr
			break
		case '-':
			result = prev - curr
			break
		case 'x':
			result = prev * curr
			break
		case '÷':
			result = curr !== 0 ? prev / curr : NaN
			break
		case '%':
			if (curr !== 0) {
				// Account for negative numbers in modulo
				if ((prev < 0 && curr > 0) || (prev > 0 && curr < 0)) {
					result = prev - curr * Math.floor(prev / curr)
				} else {
					result = prev % curr
				}
			} else {
				result = NaN
			}
			break
		default:
			result = curr
	}

	if (result > 9999999999) {
		resultStr = '9999999999'
	} else if (result < -999999999) {
		resultStr = '-999999999'
	} else if (isNaN(result) || !isFinite(result)) {
		resultStr = 'Error'
	} else {
		// Always show decimal notation, remove trailing zeros
		let fixed = result.toFixed(MAX_LENGTH)
		// Remove trailing zeros and possible trailing decimal point
		resultStr = fixed.replace(/\.?0+$/, '')
		// Truncate if still too long
		if (resultStr.length > MAX_LENGTH) {
			resultStr = resultStr.slice(0, MAX_LENGTH)
			// Remove trailing zeros and possible trailing decimal point again
			resultStr = resultStr.replace(/\.?0+$/, '')
		}
		// Convert "-0" to "0"
		if (resultStr === '-0') {
			resultStr = '0'
		}
	}

	currentValue = resultStr
	operator = ''
	isNewEntry = true
	updateDisplay(currentValue)
}

// Event listeners for buttons
window.addEventListener('load', () => {
	if (calcDisplay) {
		calcDisplay.value = '0'
	}
	const btnGrid: HTMLElement | null = document.getElementById('calc-btn-grid')
	if (btnGrid) {
		btnGrid.addEventListener('click', (e: Event) => {
			const target = e.target as HTMLElement
			if (!target.matches('button')) return
			const btnId: string = target.id
			const btnText: string = target.textContent || ''
			switch (btnId) {
				case 'btn-0':
				case 'btn-1':
				case 'btn-2':
				case 'btn-3':
				case 'btn-4':
				case 'btn-5':
				case 'btn-6':
				case 'btn-7':
				case 'btn-8':
				case 'btn-9':
					inputNumber(btnText)
					break
				case 'btn-decimal':
					inputDecimal()
					break
				case 'btn-add':
					inputOperator('+')
					break
				case 'btn-subtract':
					inputOperator('-')
					break
				case 'btn-multiply':
					inputOperator('x')
					break
				case 'btn-divide':
					inputOperator('÷')
					break
				case 'btn-modulo':
					inputOperator('%')
					break
				case 'btn-sign-change':
					changeSign()
					break
				case 'btn-clear':
					clearAll()
					break
				case 'btn-clear-entry':
					clearEntry()
					break
				case 'btn-equals':
					calculate()
					break
			}
		})
	}
})
