import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor'

// Background: Load the homepage
Given('I visit the homepage', () => {
	cy.visit('')
})

// Scenario: Check title
When('I load the homepage at the correct the sub directory', () => {
	cy.location('pathname').should('eq', `/`)
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
