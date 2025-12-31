Cypress.on('uncaught:exception', (err, runnable) => {
  // For some reason the web app undertest through an error when loaded in Cypress
  // returning false here prevents Cypress from
  // failing the test
  return false
})

// ***********************
// Sample test does not follow Cypress best practices, it is used to demonstrate the flaky test audit report
// ***********************

describe('Flaky Suite', { tags: ['@flaky-demo'] }, () => {

  before(() => {
    // Not tracked in the suite test audit or the html report
    cy.log('before')
  })
  
  after(() => {
    // Not tracked in the suite test audit or the html report
    cy.log('after')
  })
  
  beforeEach(() => { // Hook will pass
    cy.log('1- beforeEach')
    cy.visit('https://automationintesting.online/')
  })
  beforeEach(() => { // It will pass
    cy.log('2- beforeEach')
    cy.wait(1100)
  })

  afterEach(() => { // Hook will pass
    cy.wrap(20).should('be.eq', 20)
    cy.wait(1500)
  })

  afterEach(() => { // ❌ Hook will fail
    cy.log('2- afterEach')
    // cy.wrap(100).should('be.eq', 300)
    cy.wrap(100).should('be.eq', 100)
  })

  // This test does not follow Cypress best practices (actually follows many bad practices),
  // but that's the point, it is used to demonstrate the flaky test audit report.
  it('Test Sample 2 - It will fail (if multiple retries configured, then in different places each retry)', () => {  // ❌ Test will fail
    cy.get('#contact input[data-testid="ContactName"]').type('John Wick', { delay: 200 })

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('Submit')
      .then($button => {
        cy.webAppDemoCommand('')

        cy.wrap($button)
          .click()
          .then(() => {
            if (Cypress.currentRetry == 0) {
              cy.url()
                .should('include', 'NOT-JOHN-WICK-PAGE.com') // For demo purposes: In the initial run (retry 0) it will fail here
            }
            else {
              cy.url()
                .should('include', '/automationintesting.online') // In the first retry it will pass
            }
          })

        cy.get('where-is-johnny')  // This would fail in the initial ran,m but never reached, so in the first retry this will be the point of failure
          .should('be.visible')
          .and('have.css', 'color', 'red')
      })

    cy.wait(200) // Do not use an explicit wait()!!! :)
    cy.wrap(50).should('be.eq', 50)
  })

  it('Test Sample 1 - It will pass', () => {  // ⏳ TEST PASS SLOW
    cy.get('#contact input[data-testid="ContactName"]').type('John Wick', { delay: 200 }) // ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]').type('John.Wick@theroundtable.com', { delay: 0 }) // ✔️ C.PASS

    cy.then(() => {
      cy.get('#contact button')
        .contains('Submit')
        .click()
    })

    cy.wait(1200) // ⏳ C.PASS SLOW
  })

})

Cypress.Commands.add('webAppDemoCommand', (value) => {
  // This is a custom command for demonstration purposes
  cy.log('The webAppDemoCommand has been called!')
  cy.wrap(value).should('be.eq', value)
})
