import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor'

// Background: Load the calculator page
Given('I visit the calculator page', () => {
	cy.visit('calculator.html')
})

// *Common Steps for calculator scenarios
When('I press =', () => {
	cy.calcEnterAction('equals')
})
Then('I should see the calculator display show {string}', (result) => {
	cy.verifyCalcResult(result)
})

// Scenario: Check title
When('I load the calculator page at the correct the sub directory', () => {
	cy.location('pathname').should('eq', `/calculator.html`)
})
Then('I should see the title of the web page as {string}', (titleText) => {
	cy.title().should('equal', titleText)
})

// Scenario Outline: Check text
When('I see an element with the data-cy attribute {string}', (dataCy) => {
	cy.getByCy(dataCy).should('be.visible').as('element')
})
Then(
	'I should expect the link to reference the correct URL {string} of the custom website or an external website',
	(url) => {
		cy.get('@clickableText').should('have.attr', 'href', url)
	}
)

// Scenario: Check footer text
When(
	'I see the footer element where the footer text has the data-cy attribute {string}',
	(dataCy) => {
		cy.getByCy(dataCy).should('be.visible').as('footerText')
	}
)
Then(
	'I should see the expected text {string} and the email address {string}',
	(expectedText, emailAddress) => {
		cy.get('@footerText')
			.invoke('text')
			.then((text) => {
				cy.wrap(text)
					.should('contain', expectedText)
					.and('contain', emailAddress)
			})
	}
)

// Scenario Outline: Check links
When('I see clickable text with the data-cy attribute {string}', (dataCy) => {
	cy.getByCy(dataCy).should('be.visible').as('clickableText')
})
Then('I should see the expected text {string} from that element', (expText) => {
	cy.get('@element')
		.invoke('text')
		.then((text) => {
			cy.wrap(text.trim()).should('equal', expText)
		})
})

// Scenario Outline: Check hover effects
When(
	'I hover over the element with the data-cy attribute {string}',
	(dataCy) => {
		// Alias the element to be hovered over
		cy.getByCy(dataCy).as('anchorElement')

		// Record the original background color before hover
		cy.get('@anchorElement')
			.invoke('css', 'background-color')
			.as('originalBgColor')

		// Perform the hover action
		cy.get('@anchorElement').realHover()
	}
)
When(
	"I see the element's background color change to these RGB values: {int}, {int}, {int}",
	(r, g, b) => {
		const hoverColor = `rgb(${r}, ${g}, ${b})`

		cy.get('@anchorElement').should('have.css', 'background-color', hoverColor)
	}
)
When('I stop hovering over the element', () => {
	// Move the mouse to the top left corner to stop hovering
	cy.get('body').realMouseMove(0, 0)
})
Then(
	"I should see the element's background color revert back to its original color",
	() => {
		cy.get('@originalBgColor').then((originalColor) => {
			cy.get('@anchorElement').should(
				'have.css',
				'background-color',
				originalColor
			)
		})
	}
)

// Scenario: Cannot modify calculator display directly
When(
	'I try to type directly into the calculator display with the data-cy attribute {string}',
	(dataCy) => {
		cy.getByCy(dataCy).as('calcDisplay')
		cy.get('@calcDisplay').should('have.attr', 'readonly')
	}
)
Then(
	'I should see that the value of the calculator display remains unchanged at {string}',
	(expectedValue) => {
		cy.get('@calcDisplay').should('have.value', expectedValue)
	}
)

// Scenario Outline: Enter numbers into the calculator
When('I enter {string} into the calculator', (numStr) => {
	cy.calcEnterNumsAndActions([numStr], [])
})

// Scenario Outline: Add two numbers using the calculator
When('I enter {string} and {string} and press +', (num1, num2) => {
	const numStrs = [num1, num2]
	const actions = ['add']

	cy.calcEnterNumsAndActions(numStrs, actions)
})

// Scenario Outline: Subtract two numbers using the calculator
When('I enter {string} and {string} and press -', (num1, num2) => {
	const numStrs = [num1, num2]
	const actions = ['subtract']

	cy.calcEnterNumsAndActions(numStrs, actions)
})

// Scenario Outline: Multiply two numbers using the calculator
When('I enter {string} and {string} and press x', (num1, num2) => {
	const numStrs = [num1, num2]
	const actions = ['multiply']

	cy.calcEnterNumsAndActions(numStrs, actions)
})

// Scenario Outline: Divide two numbers using the calculator
When('I enter {string} and {string} and press ÷', (num1, num2) => {
	const numStrs = [num1, num2]
	const actions = ['divide']

	cy.calcEnterNumsAndActions(numStrs, actions)
})

// Scenario Outline: Get the remainder of two numbers using the calculator
When('I enter {string} and {string} and press %', (num1, num2) => {
	const numStrs = [num1, num2]
	const actions = ['modulo']

	cy.calcEnterNumsAndActions(numStrs, actions)
})

// Scenario Outline: The correct numbers appear in the results bar when one number and one operation are entered
When('I enter {string} and press {string}', (num1, op1) => {
	const numStrs = [num1]

	cy.calcEnterNumsAndActions(numStrs, [])
	cy.calcEnterAction(op1)
})

// Scenario Outline: Calculate with three numbers and two operations using the calculator
When(
	'I enter {string}, press {string}, enter {string}, press {string}, and enter {string}',
	(num1, op1, num2, op2, num3) => {
		const numStrs = [num1, num2, num3]
		const actions = [op1, op2]

		cy.calcEnterNumsAndActions(numStrs, actions)
	}
)

// Scenario Outline: Enter one number, clear entry, and then enter a new number so that the results bar should only show the new number
When('I enter {string}, press CE, and enter {string}', (num1, num2) => {
	const numStrs = [num1, num2]
	const actions = ['clearEntry']

	cy.calcEnterNumsAndActions(numStrs, actions)
})

// Scenario Outline: Enter one number, then the operation, then the next number, then clear entry, and then enter a new number so that the results bar should show the result of the first number and operation with the new number.
When(
	'I enter {string}, press {string}, enter {string}, press CE, and enter {string}',
	(num1, op1, num2, num3) => {
		const numStrs = [num1, num2, num3]
		const actions = [op1, 'clearEntry']

		cy.calcEnterNumsAndActions(numStrs, actions)
	}
)

// Scenario Outline: Enter two numbers, press the clear button, and then do two new numbers so that the results bar should only show the result of the second calculation
When(
	'I enter {string}, press {string}, enter {string}, press C, enter {string}, press {string}, and enter {string}',
	(num1, op1, num2, num3, op2, num4) => {
		const numStrs = [num1, num2, num3, num4]
		const actions = [op1, 'clear', op2]
		cy.calcEnterNumsAndActions(numStrs, actions)
	}
)

// Scenario: Clicking the sign change button twice should return the number to its original value
When('I enter a number like {string} into the calculator', (numStr) => {
	cy.calcEnterNumsAndActions([numStr], [])
})

When('I press the sign change button twice', () => {
	cy.calcEnterAction('signchange')
	cy.calcEnterAction('signchange')
})

// Scenario: Clicking the decimal button twice should not add a second decimal point to the number
When('I first enter a number like {string} into the calculator', (numStr) => {
	cy.calcEnterNumsAndActions([numStr], [])
})

When('I press the decimal button', () => {
	cy.calcEnterAction('decimal')
})

When('I enter more numbers like {string}', (numStr) => {
	cy.calcEnterNumsAndActions([numStr], [])
})

When('I press the decimal button again', () => {
	cy.calcEnterAction('decimal')
})
