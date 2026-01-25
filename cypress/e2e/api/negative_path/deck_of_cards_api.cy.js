describe('Deck of Cards API Tests (Negative)', () => {
	const decksPath = 'cypress/fixtures/deck_of_cards_api/current_decks_neg.json'
	const shuffledDeckKeys = Object.freeze({
		SDS: 'singleDeckShuffled',
		SDSJ: 'singleDeckShuffledWithJokers',
		DDS: 'doubleDeckShuffled',
		DDSJ: 'doubleDeckShuffledWithJokers'
	})
	const maxCardCount = 52
	const maxCardCountWithJokers = 54

	before(() => {
		cy.checkDecks(decksPath)
	})

	beforeEach(() => {
		cy.section('Shuffle the shuffled decks to their full stacks')
		for (let key in shuffledDeckKeys) {
			cy.shuffleDeck(`${shuffledDeckKeys[key]}`)
		}
		cy.section('Beginning the test case')
	})

	context('New Deck Error Handling', () => {
		it('Make a new deck with "deck_count" equal to 0', () => {
			const deckObj = {
				deckCount: 0
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new deck with "deck_count" equal to -1', () => {
			const deckObj = {
				deckCount: -1
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new shuffled deck with "deck_count" equal to 0', () => {
			const deckObj = {
				deckCount: 0,
				shuffled: true
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new shuffled deck with "deck_count" equal to -1', () => {
			const deckObj = {
				deckCount: -1,
				shuffled: true
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new deck with jokers with "deck_count" equal to 0', () => {
			const deckObj = {
				deckCount: 0,
				jokersEnabled: true
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new deck with jokers with "deck_count" equal to -1', () => {
			const deckObj = {
				deckCount: -1,
				jokersEnabled: true
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new shuffled deck with jokers with "deck_count" equal to 0', () => {
			const deckObj = {
				deckCount: 0,
				shuffled: true,
				jokersEnabled: true
			}

			cy.createInvalidDeck(deckObj)
		})

		it('Make a new shuffled deck with jokers with "deck_count" equal to -1', () => {
			const deckObj = {
				deckCount: -1,
				shuffled: true,
				jokersEnabled: true
			}

			cy.createInvalidDeck(deckObj)
		})
	})

	context('Drawing Cards from Decks Error Handling', () => {
		it('Draw a card from a deck that does not exist', () => {
			cy.drawCardsFromNoDeck()
		})

		it('Draw 0 cards from a shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const maxCardsExpected = maxCardCount

			cy.drawZeroCardsFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 0 cards from a shuffled deck with jokers', () => {
			const deckKey = shuffledDeckKeys.SDSJ
			const maxCardsExpected = maxCardCountWithJokers

			cy.drawZeroCardsFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 0 cards from two shuffled decks', () => {
			const deckKey = shuffledDeckKeys.DDS
			const maxCardsExpected = maxCardCount * 2

			cy.drawZeroCardsFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 0 cards from two shuffled decks with jokers', () => {
			const deckKey = shuffledDeckKeys.DDSJ
			const maxCardsExpected = maxCardCountWithJokers * 2

			cy.drawZeroCardsFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 53 cards from a shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const maxCardsExpected = maxCardCount

			cy.drawOneOverMaxFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 55 cards with jokers from a shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDSJ
			const maxCardsExpected = maxCardCountWithJokers

			cy.drawOneOverMaxFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 105 cards from two shuffled decks', () => {
			const deckKey = shuffledDeckKeys.DDS
			const maxCardsExpected = maxCardCount * 2

			cy.drawOneOverMaxFromDeck(deckKey, maxCardsExpected)
		})

		it('Draw 109 cards from two shuffled decks with jokers', () => {
			const deckKey = shuffledDeckKeys.DDSJ
			const maxCardsExpected = maxCardCountWithJokers * 2

			cy.drawOneOverMaxFromDeck(deckKey, maxCardsExpected)
		})
	})

	context('Piles Error Handling', () => {
		it('Add no specified cards to a pile', () => {
			const deckKey = shuffledDeckKeys.SDS
			const pileName = 'test_pile'

			cy.addNoCardsToPile(deckKey, pileName)
		})

		it('Draw 1 card from a pile that has no cards in it from a single shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const cardsToDraw = 1
			const pileName = 'test_pile'

			// Just create the pile with no cards in it
			cy.addCardsToPile(deckKey, pileName, '')
			cy.drawOneOverMaxFromPile(deckKey, pileName, cardsToDraw)
		})

		it('Draw 1 card from the bottom of a pile that has no cards in it from a single shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const cardsToDraw = 1
			const pileName = 'test_pile'
			const drawAct = 'bottom'

			// Just create the pile with no cards in it
			cy.addCardsToPile(deckKey, pileName, '')
			cy.drawOneOverMaxFromPile(deckKey, pileName, cardsToDraw, drawAct)
		})

		it('Draw 1 card at random from a pile that has no cards in it from a single shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const cardsToDraw = 1
			const pileName = 'test_pile'
			const drawAct = 'random'

			// Just create the pile with no cards in it
			cy.addCardsToPile(deckKey, pileName, '')
			cy.drawOneOverMaxFromPile(deckKey, pileName, cardsToDraw, drawAct)
		})

		it('Draw 53 cards from a pile that only has 52 cards in it from a single shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const cardsToDraw = maxCardCount
			const drawOneOver = maxCardCount + 1
			const pileName = 'test_pile'

			cy.drawCardsFromDeck(deckKey, cardsToDraw)
			cy.get('@recentDrawDeckResp').then((drawDeckResp) => {
				const cardsLength = drawDeckResp.body.cards.length

				cy.createCardCodeStrings(drawDeckResp.body.cards, cardsLength)
				cy.get('@allCardCodes').then((cardCodes) => {
					cy.addCardsToPile(deckKey, pileName, cardCodes)
					cy.drawOneOverMaxFromPile(deckKey, pileName, drawOneOver)
				})
			})
		})

		it('Draw 53 cards from the bottom of a pile that only has 52 cards in it from a single shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const cardsToDraw = maxCardCount
			const drawOneOver = maxCardCount + 1
			const pileName = 'test_pile'
			const drawAct = 'bottom'

			cy.drawCardsFromDeck(deckKey, cardsToDraw)
			cy.get('@recentDrawDeckResp').then((drawDeckResp) => {
				const cardsLength = drawDeckResp.body.cards.length

				cy.createCardCodeStrings(drawDeckResp.body.cards, cardsLength)
				cy.get('@allCardCodes').then((cardCodes) => {
					cy.addCardsToPile(deckKey, pileName, cardCodes)
					cy.drawOneOverMaxFromPile(deckKey, pileName, drawOneOver, drawAct)
				})
			})
		})

		it('Draw 53 cards at random from a pile that only has 52 cards in it from a single shuffled deck', () => {
			const deckKey = shuffledDeckKeys.SDS
			const cardsToDraw = maxCardCount
			const drawOneOver = maxCardCount + 1
			const pileName = 'test_pile'
			const drawAct = 'random'

			cy.drawCardsFromDeck(deckKey, cardsToDraw)
			cy.get('@recentDrawDeckResp').then((drawDeckResp) => {
				const cardsLength = drawDeckResp.body.cards.length

				cy.createCardCodeStrings(drawDeckResp.body.cards, cardsLength)
				cy.get('@allCardCodes').then((cardCodes) => {
					cy.addCardsToPile(deckKey, pileName, cardCodes)
					cy.drawOneOverMaxFromPile(deckKey, pileName, drawOneOver, drawAct)
				})
			})
		})

		it('Draw 55 cards from a pile that only has 54 cards in it from a single shuffled deck with jokers', () => {
			const deckKey = shuffledDeckKeys.SDSJ
			const cardsToDraw = maxCardCountWithJokers
			const drawOneOver = maxCardCountWithJokers + 1
			const pileName = 'test_pile'

			cy.drawCardsFromDeck(deckKey, cardsToDraw)
			cy.get('@recentDrawDeckResp').then((drawDeckResp) => {
				const cardsLength = drawDeckResp.body.cards.length

				cy.createCardCodeStrings(drawDeckResp.body.cards, cardsLength)
				cy.get('@allCardCodes').then((cardCodes) => {
					cy.addCardsToPile(deckKey, pileName, cardCodes)
					cy.drawOneOverMaxFromPile(deckKey, pileName, drawOneOver)
				})
			})
		})

		it('Draw 55 cards from the bottom of a pile that only has 54 cards in it from a single shuffled deck with jokers', () => {
			const deckKey = shuffledDeckKeys.SDSJ
			const cardsToDraw = maxCardCountWithJokers
			const drawOneOver = maxCardCountWithJokers + 1
			const pileName = 'test_pile'
			const drawAct = 'bottom'

			cy.drawCardsFromDeck(deckKey, cardsToDraw)
			cy.get('@recentDrawDeckResp').then((drawDeckResp) => {
				const cardsLength = drawDeckResp.body.cards.length

				cy.createCardCodeStrings(drawDeckResp.body.cards, cardsLength)
				cy.get('@allCardCodes').then((cardCodes) => {
					cy.addCardsToPile(deckKey, pileName, cardCodes)
					cy.drawOneOverMaxFromPile(deckKey, pileName, drawOneOver, drawAct)
				})
			})
		})

		it('Draw 55 cards at random from a pile that only has 54 cards in it from a single shuffled deck with jokers', () => {
			const deckKey = shuffledDeckKeys.SDSJ
			const cardsToDraw = maxCardCountWithJokers
			const drawOneOver = maxCardCountWithJokers + 1
			const pileName = 'test_pile'
			const drawAct = 'random'

			cy.drawCardsFromDeck(deckKey, cardsToDraw)
			cy.get('@recentDrawDeckResp').then((drawDeckResp) => {
				const cardsLength = drawDeckResp.body.cards.length

				cy.createCardCodeStrings(drawDeckResp.body.cards, cardsLength)
				cy.get('@allCardCodes').then((cardCodes) => {
					cy.addCardsToPile(deckKey, pileName, cardCodes)
					cy.drawOneOverMaxFromPile(deckKey, pileName, drawOneOver, drawAct)
				})
			})
		})
	})
})
