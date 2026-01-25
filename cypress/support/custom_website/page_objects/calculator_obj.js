let instance

/**
 * Singleton object representing the Calculator page of my custom website.
 */
class CalculatorPage {
	constructor() {
		if (!instance) {
			instance = this
		}
	}

	/**
	 * Enters a number into the calculator by clicking the appropriate buttons.
	 * Handles decimal points and negative sign.
	 * @param {string} numStr - The number string to enter (may include '-' and '.').
	 */
	enterNumber(numStr) {
		for (const digit of numStr) {
			if (digit === '.') {
				cy.getByCy('btn-decimal').realClick()
			} else if (digit >= '0' && digit <= '9') {
				cy.getByCy(`btn-${digit}`).realClick()
			}
		}
		if (numStr.startsWith('-')) {
			cy.getByCy('btn-sign-change').realClick()
		}
	}

	/**
	 * Presses the addition (+) button.
	 */
	pressAdd() {
		cy.getByCy('btn-add').realClick()
	}

	/**
	 * Presses the subtraction (-) button.
	 */
	pressSubtract() {
		cy.getByCy('btn-subtract').realClick()
	}

	/**
	 * Presses the multiplication (x) button.
	 */
	pressMultiply() {
		cy.getByCy('btn-multiply').realClick()
	}

	/**
	 * Presses the division (÷) button.
	 */
	pressDivide() {
		cy.getByCy('btn-divide').realClick()
	}

	/**
	 * Presses the modulo (%) button.
	 */
	pressModulo() {
		cy.getByCy('btn-modulo').realClick()
	}

	/**
	 * Presses the decimal (.) button.
	 */
	pressDecimal() {
		cy.getByCy('btn-decimal').realClick()
	}

	/**
	 * Presses the sign change (±) button.
	 */
	pressSignChange() {
		cy.getByCy('btn-sign-change').realClick()
	}

	/**
	 * Presses the clear (C) button to reset the calculator.
	 */
	pressClear() {
		cy.getByCy('btn-clear').realClick()
	}

	/**
	 * Presses the clear entry (CE) button to reset the current entry.
	 */
	pressClearEntry() {
		cy.getByCy('btn-clear-entry').realClick()
	}

	/**
	 * Presses the equals (=) button to perform the calculation.
	 */
	pressEquals() {
		cy.getByCy('btn-equals').realClick()
	}

	/**
	 * Gets the current value displayed on the calculator.
	 * @returns {Cypress.Chainable<string>} The value in the calculator display.
	 */
	getDisplayResult() {
		return cy.getByCy('calc-display').invoke('val')
	}
}

export default Object.freeze(new CalculatorPage())
