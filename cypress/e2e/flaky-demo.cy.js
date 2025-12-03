
describe('Something', { tags: ['@plugin', '@flaky-demo'] }, () => {

  beforeEach(() => {
    cy.visit('https://parabank.parasoft.com/parabank/index.htm')
  })

  it('test 1', () => {
    const timeToWait = 500;

    cy.get('input[name="username"]').type('paul', { delay: 500 }) // ✔️ PASS
    cy.get('input[name="password"]').type('mcCartney', { delay: 0 }) // ✔️ PASS

    cy.get('input[name="username"]') // ✔️ PASS
      .should('have.value', 'paul') // ✔️ PASS
      .and('have.class', 'nowayjose') // ❌ FAIL (class not found)

    cy.wait(timeToWait) // ⛔ NEVER RUN
    cy.get('input[type="submit"]').click() // ⛔ NEVER RUN
  })

  it('test 2', () => {
    const timeToWait = 1000;

    cy.get('input[name="username"]').type('ringo') // ✔️ PASS
    cy.get('input[name="password"]').type('starr') // ✔️ PASS

    cy.then(() => {
      cy.get('input[type="submit"]') // ✔️ PASS
        .click() // ✔️ PASS
    })

    cy.wait(timeToWait) // ✔️ PASS
  })

  it('test 3', () => {
    const timeToWait = 1000;

    cy.get('input[name="username"]')
      .should('be.visible') // ✔️ PASS

    cy.wait(timeToWait) // ✔️ PASS
    cy.get('input[name="password"]')
      .should('be.visible') // ✔️ PASS
  })

  it('test 4', () => {
    cy.get('input[name="username"]').type('john') // ✔️ PASS
    cy.get('input[name="password"]').type('lennon') // ✔️ PASS

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
    const timeToWait = 200;

    cy.get('input[name="username"]').type('ringo') // ✔️ PASS
    cy.get('input[name="password"]').type('starr', { delay: 400 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('input[type="submit"]').then($button => {
      cy.wrap($button).click() // ✔️ PASS
      cy.url()
        .should('include', 'not-my-bank') // ❌ FAIL (url not found)
    })

    cy.wait(timeToWait) // ⛔ NEVER RUN
  })

})
