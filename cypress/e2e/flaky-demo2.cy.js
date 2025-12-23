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
    cy.visit('https://automationintesting.online/')
  })

  afterEach(() => {
    // cy.wrap(20)
    //   .should('be.eq', 20)
    // cy.wrap(10)
    //   .should('be.eq', 30)
    cy.log('1- afterEach')
  })
  
  // afterEach(() => {
  //   cy.log('2- afterEach')
  // })


  it('test 1.1', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 }) // ⏳ C.PASS SLOW
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 }) // ✔️ C.PASS

    cy.get('input[data-testid="EEEE"]') // ❌ C.FAIL  // Note: This test cause the exact same output and error as 'test 1.2' (even when tsest 1.1 faild in the get and test 1.2 fails the should assertion)
      .should('have.value', 'paul mcCartney')
      .and('have.class', 'form-control')
      .and('have.css', 'color', 'red')

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  it.only('test 1.2', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartneyyyyyyy')
      .and('have.class', 'form-control')


    cy.wait(timeToWait) // ⛔ C.NEVER RUN

  })

  it('test 1.3', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartney')
      .and('have.class', 'form-controlllll') // ❌ C.FAIL
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
      .and('have.class', 'form-control')
      .and('have.css', 'color', 'red') // ❌ C.FAIL

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })


  it('test 1.4-b', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('John Wick')
    cy.get('#contact input[data-testid="ContactEmail"]').type('John.Wick@theroundtable.com', { delay: 0 })

    // ---------------------------------------------------------------------

    // CORRECT
    // cy.wrap({ width: 50 }).its('width') // Passes (that is correct)
    //   .should('eq', 51) // This assertion is what fails (that is correct)

    // INCORRECT
    // cy.wrap('pepito pulgarcito') // In this case says that fails the wrap command but the issue is in the assertion               //.contains('pulgarcito') // contains expect yielded a DOM element
    //   .should('contains', 'pulgarcitoooo') // It is skipped

    // INCORRECT
    // cy.get('#contact input[data-testid="ContactName"]')  // It says fails the get, but is the assertion what fails
    //   .should('have.value', 'paul mcCartneyyyyy') // It is skipped

    // INCORRECT
    // cy.get('#contact input[data-testid="ContactNameeeee"]')  // It says that pass the get, but it is never found (so should fail)
    //   .should('have.value', 'paul mcCartney') // It says it fails the assertion, but was the get that failed

    // ---------------------------------------------------------------------

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'John Wickyyyyyy 😎')
      .and('have.class', 'form-control')
    // .and('have.css', 'color', 'red') // ❌ C.FAIL

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })



  //---------------------------------------------------------------------

  it('test 1.5', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartney')
      .and('have.class', 'form-controlllll')// ❌ C.FAIL
      .and('have.attr', 'data-testid', 'ContactName')


    // Using .then() for demo purposes
    // Never will enter within the cy.then() 
    cy.then(() => {
      cy.get('#contact buttonNNNNNN')
        .contains('SubmitYYYYYYYY')
        .click()
      cy.get('#contact input[aaa"]')
      cy.then(() => {
        cy.url()
          .should('include', 'NOT-MY-PAGE')
      })
      // TODO: ADD A SECOND NESTED LEVEL OF THEN() HERE TO VERIFY THE GRAPH IS CORRECT
    })

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  it('test 1.6', () => {  // ❌ TEST FAIL 
    const timeToWait = 500;

    cy.get('#contact input[data-testid="ContactName"]').type('paul mcCartney', { delay: 200 })
    // cy.get('#contact input[data-testid="ContactEmail"]').type('paul.mcCartney@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'paul mcCartney')
      .and('have.class', 'form-control')
      .and('have.attr', 'data-testid', 'ContactName')

    // Using .then() for demo purposes
    // Never will enter within the cy.then() 
    cy.then(() => {
      cy.get('#contact buttonNNNNNN')
        .contains('SubmitYYYYYYYY')
        .click()
      cy.get('#contact input[aaa"]')
      cy.then(() => {
        cy.url()
          .should('include', 'NOT-MY-PAGE')
      })
    })

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
    cy.get('#contact button') // ⛔ C. NEVER RUN
      .contains('Submit') // ⛔ C.NEVER RUN
      .click() // ⛔ C.NEVER RUN
  })

  //---------------------------------------------------------------------
  it.only('test 2.1 - now has a much longer test title that is longer than the previous test title to see how it looks in the report', () => {  // ⏳ TEST PASS SLOW
    const timeToWait = 1200;

    cy.get('#contact input[data-testid="ContactName"]').type('John Wick', { delay: 200 }) // ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]').type('John.Wick@theroundtable.com', { delay: 0 }) // ✔️ C.PASS

    cy.then(() => {
      cy.get('#contact button')
        .contains('Submit')
        .click()
    })

    cy.wait(timeToWait) // ⏳ C.PASS SLOW
  })

  it.only('test 2.2', () => {  // ❌ TEST FAIL
    const timeToWait = 1200;

    cy.get('#contact input[data-testid="ContactName"]').type('John Wick', { delay: 200 }) // ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]').type('John.Wick@theroundtable.com', { delay: 0 }) // ✔️ C.PASS

    cy.then(() => {
      if (Cypress.currentRetry == 0) {
        cy.get('#contact button')
          .contains('Submityyyyy')  // C.FAIL
          .click()
      }
      else {
        cy.get('#contact button')
          .contains('Submit')
          .click()
      }      
    })

    cy.wait(timeToWait) // ⏳ C.PASS SLOW
  })

  //---------------------------------------------------------------------

  it('test 3', () => {  // ✔️ TEST PASS
    const timeToWait = 1100;

    cy.get('#contact input[data-testid="ContactName"]')
      .should('be.visible') // ✔️ C.PASS

    cy.wait(timeToWait) // ✔️ ⏳ C.PASS SLOW
    cy.get('#contact input[data-testid="ContactEmail"]')
      .should('be.visible') // ✔️ C.PASS
  })

  //---------------------------------------------------------------------
  it('test 4', () => {  // ❌ TEST FAIL 
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('john lennon') // ✔️ C.PASS
    cy.get('#contact input[data-testid="ContactEmail"]').type('john.lennon@gmail.com', { delay: 0 }) // ✔️ C.PASS

    // Using .then() for demo purposes
    cy.then(() => {
      cy.get('#contact button')
        .contains('SubmitYYYYYYYY').click()
      cy.url()
        .should('include', 'NOT-MY-PAGE')
    })

    cy.wait(timeToWait) // ⛔ C.NEVER RUN
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
        cy.wrap($button)
          .click()

        cy.url()
          .should('include', 'NOT-MY-PAGE')
      })

    cy.wait(timeToWait) // ⛔ NEVER RUN
  })

  it.only('test 7.1', () => {  // ❌ TEST FAIL
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr') // ✔️ PASS
    // cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('Submit')
      .then($button => {
        cy.wrap($button)
          .click()
          .then(() => {
            if (Cypress.currentRetry == 0) {
              cy.url()
                .should('include', 'NOT-MY-PAGE')
            }
            else {
              cy.url()
                .should('include', '/automationintesting.online')
            }
          })

        cy.get('somethingnotfound')
          .should('be.visible')
          .and('have.css', 'color', 'red')
      })

    cy.wait(timeToWait)
  })

  it.skip('test skipped', () => {  // TEST FAIL
  })


  it('test 7.1.1', () => {  // TEST FAIL
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr') // ✔️ PASS
    // cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('Submit')
      .then($button => {
        cy.then(() => {
          cy.url()
            .should('include', 'NOT-MY-PAGE') // ❌ C.FAIL
        })

        cy.get('somethingnotfound')
          .should('be.visible')
      })

    cy.wait(timeToWait)
  })
  
  it.only('test 7.2', () => {  // TEST PASS
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr') // ✔️ PASS
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 }) // ✔️ PASS

    // Using .then() for demo purposes, but normally you would use .click() directly
    cy.get('#contact button')
      .contains('Submit')
      .then($button => {
        cy.wrap($button)
          .click()
          .then(() => {
            cy.url()
              .should('include', 'NOT-MY-PAGE') // ❌ C.FAIL
          })
      })

    cy.wait(timeToWait)
  })
  //---------------------------------------------------------------------

  it('test 8', () => {  // ❌ TEST FAIL 
    const timeToWait = 200;

    cy.get('#contact input[data-testid="ContactName"]').type('ringo starr')
    cy.get('#contact input[data-testid="ContactEmail"]').type('ringo.starr@gmail.com', { delay: 0 })

    cy.get('#contact input[data-testid="ContactName"]')
      .should('have.value', 'ringo starr')
      .and('have.class', 'form-control')
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

  //---------------------------------------------------------------------

  it('test 9', () => {

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


})