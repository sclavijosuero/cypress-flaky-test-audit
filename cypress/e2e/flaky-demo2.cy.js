Cypress.on('uncaught:exception', (err, runnable) => {
  // For some reason the web app undertest through an error when loaded in Cypress
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Something', { tags: ['@plugin', '@flaky-demo'] }, () => {

  // after(() => {
  //   cy.log('------- <AFTER>')
  // })

  beforeEach(() => {
    console.log('#### START TEST (BEFORE EACH) #######################################################')
    cy.visit('https://automationintesting.online/')
  })

  it('test 1.1', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 }) // ⏳ C.PASS SLOW
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 }) // ✔️ C.PASS

    cy.get('input[data-testid="EEEE"]') // ❌ C.FAIL  // Note: This test cause the exact same output and error as 'test 1.2' (even when tsest 1.1 faild in the get and test 1.2 fails the should assertion)
      .should('have.value', 'paul mcCartney')
      .and('includes', 'paul')
      .and('have.css', 'color', 'red')

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  it('test 1.2', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartneyyyyyyy') // ❌ C.FAIL
      .and('includes', 'paul')
      .and('have.css', 'color', 'red')

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  it('test 1.3', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartney')
      .and('includes', 'paullllll') // ❌ C.FAIL
      .and('have.css', 'color', 'red')

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  it('test 1.4', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartney')
      .and('includes', 'paul')
      .and('have.css', 'color', 'red') // ❌ C.FAIL

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  it('test 2.1', () => {  // ⏳ TEST PASS SLOW
    const timeToWait = 1200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr', { delay: 200 }) // ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ C.PASS

    cy.then(() => {
      cy.get('#contact button') // C.PASS   
        .contains('Submit') // C.PASS   
        .click() // C.PASS   
    })

    cy.wait(timeToWait) // ⏳ C.PASS SLOW
  })

  it('test 2.2', () => {  // ⏳ TEST PASS SLOW
    const timeToWait = 1200;

    cy.get('#contact input[data-testid="ContactNameRRRRRR"]').type('ringo starr', { delay: 200 }) // ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ C.PASS

    cy.then(() => {
      cy.get('#contact button') // C.PASS   
        .contains('Submit') // C.PASS   
        .click() // C.PASS   
    })

    cy.wait(timeToWait) // ⏳ C.PASS SLOW
  })
  it('test 3', () => {  // ✔️ TEST PASS
    const timeToWait = 1000;

    cy.get('#contact input[data-testid="ContactName"]')
      .should('be.visible') // ✔️ C.PASS

    cy.wait(timeToWait) // ✔️ ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]')
      .should('be.visible') // ✔️ C.PASS
  })


  it('test 4', () => {  // ❌ TEST FAIL 
    cy.get('#contact input[data-testid="ContactName"]').type('john lennon') // ✔️ C.PASS
    cy.get('#contact input[data-testid="ContactEmail"]').type('john.lennon@gmail.com', { delay: 0 }) // ✔️ C.PASS

    // Using .then() for demo purposes
    cy.then(() => {
      cy.get('#contact button').contains('SubmitYYYYYYYY').click() // ❌ C.FAIL (selector not found)
    })
  })

  it('test 5', () => {  // ❌ TEST FAIL 
    cy.get('#contact input[data-testid="ContactName"]').type('george harrison') // ✔️ C.PASS  
    cy.get('#contact input[data-testid="ContactEmail"]').type('george.harrison@gmail.com', { delay: 0 }) // ✔️ C.PASS

    cy.get('#contact input[data-testid="ContactName"]')
      .should('not.have.value', 'george harrison') // ❌ C.FAIL (value not found)
  })

  it('test 6', () => {  // ❌ TEST FAIL 
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr') // ✔️ PASS
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('Submit')
      .then($button => {
        cy.wrap($button) // C.PASS
          .click() // C.PASS

        cy.url() // ✔️ C.PASS
          .should('include', 'NOT-MY-PAGE') // ❌ FAIL (url not found)
      })

    cy.wait(timeToWait) // ⛔ NEVER RUN
  })

  it('test 7', () => {  // ❌ TEST FAIL 
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr') // ✔️ PASS
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('SubmitYYYYYYYY')
      .then($button => {
        cy.wrap($button) // C.PASS
          .click() // C.PASS
          .then(() => {
            cy.url() // ✔️ C.PASS
              .should('include', 'NOT-MY-PAGE') // Nover reached
          })

        cy.get('somethingnotfound')
          .should('be.visible') // ❌ never reached
      })

    cy.wait(timeToWait) // ⛔ NEVER RUN
  })

  it('test 8', () => {  // ❌ TEST FAIL 
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr')
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartney')
      .and('includes', 'paul')
      .and('includes', 'ringo')


    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('SubmitYYYYYYYY')
      .then($button => {
        cy.wrap($button)
          .click()
          .then(() => {
            cy.url()
              .should('include', 'NOT-MY-PAGE')
          })

        cy.get('somethingnotfound')
          .should('be.visible')

        cy.wait(timeToWait)
      })
  })

  it.only('test 9', () => {

    cy.get('.card.shadow.booking-card')
      .should('be.visible')
      .find('input.form-control')
      .first()
      .as('input1')
      .type('{selectall}{backspace}05/12/2025')

    cy.get('@input1')
      .then($input => {
        cy.wrap($input)
          .should('have.value', '05/12/2025')
          .and('have.class', 'form-control')
      })

    cy.get('.row.justify-content-center')
      .should('be.visible')
      .within(() => {
        cy.get('.h4.mb-4.text-center')
          .should('be.visible')
          .and('have.text', 'Send Us a Message')
          .and('have.class', 'text-center')

        cy.get('input.form-control[data-testid="ContactName"]')
          .type('abcde')
          .should('have.value', 'abcde')
          .and('have.class', 'form-control')
          .and('have.attr', 'data-testid', 'ContactName')

        cy.get('button')
          .contains('Submit')
          .click()
          // .then(() => {
          //   cy.url()
          //     .should('not.include', 'NOT-MY-PAGE')
          // })
      })

      cy.wait(1000)
      cy.log('------- <END OF TEST 9>')


  })

  afterEach(() => {
    cy.log('------- <AFTER EACH>')
  })

  after(() => {
    cy.log('------- <AFTER>')
  })

})