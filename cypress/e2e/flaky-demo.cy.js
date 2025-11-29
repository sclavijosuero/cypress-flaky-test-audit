
describe('Something', { tags: ['@plugin', '@flaky-demo'] }, () => {

  beforeEach(() => {
    cy.visit('https://parabank.parasoft.com/parabank/index.htm')
  })

  it.only('test 1', () => {
    cy.get('input[name="username"]').type('paul', { delay: 500 }) // ✔️ PASS
    cy.get('input[name="password"]').type('mcCartney', { delay: 0, something: 'else' }) // ✔️ PASS

    cy.get('input[name="username"]') // ✔️ PASS
      .should('have.value', 'paul') // ✔️ PASS
      .and('have.class', 'nowayjose') // ❌ FAIL (class not found)

    cy.wait(500) // ⛔ NEVER RUN
    cy.get('input[type="submit"]').click() // ⛔ NEVER RUN
  })

  it('test 2', () => {
    cy.get('input[name="username"]').type('ringo') // ✔️ PASS
    cy.get('input[name="password"]').type('starr') // ✔️ PASS

    cy.then(() => {
      cy.get('input[type="submit"]') // ✔️ PASS
        .click() // ✔️ PASS
    })

    cy.wait(1000) // ✔️ PASS
  })

  it.only('test 3', () => {
    cy.get('input[name="username"]')
      .should('be.visible') // ✔️ PASS

    cy.wait(3000) // ✔️ PASS
    cy.get('input[name="password"]')
      .should('be.visible') // ✔️ PASS
  })

  it('test 4', () => {
    cy.get('input[name="username"]').type('ringo') // ✔️ PASS
    cy.get('input[name="password"]').type('starr') // ✔️ PASS

    // Using .then() for demo purposes
    cy.then(() => {
      cy.get('input[type="notfound"]').click() // ❌ FAIL (selector not found)
    })
  })

  it('test 5', () => {
    cy.get('input[name="username"]').type('george') // ✔️ PASS
    cy.get('input[name="password"]').type('harrison') // ✔️ PASS

    cy.get('input[name="username"]')
      .should('not.have.value', 'george') // ❌ FAIL
  })

  it.only('test 6', () => {
    cy.get('input[name="username"]').type('ringo') // ✔️ PASS
    cy.get('input[name="password"]').type('starr', { delay: 400 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('input[type="submit"]').then($button => {
      cy.wrap($button).click() // ✔️ PASS
      cy.url()
        .should('include', 'not-my-bank') // ❌ FAIL (url not found)
    })

    cy.wait(200) // ⛔ NEVER RUN
  })

})
