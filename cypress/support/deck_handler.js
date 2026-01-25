let instance

/**
 * Singleton for handling and executing the methods available for the
 * Deck of Cards API.
 */
class DeckHandler {
	#maxCardCount
	#maxCardCountWithJokers

	constructor() {
		if (!instance) {
			instance = this
		}

		this.#maxCardCount = 52
		this.#maxCardCountWithJokers = 54
	}

	get maxCardCount() {
		return this.#maxCardCount
	}

	get maxCardCountWithJokers() {
		return this.#maxCardCountWithJokers
	}

	/**
	 * Create a new deck of cards or a partial deck based on the given
	 * properties in the deck object.
	 * @param {object} deckObj The deck object containing the properties.
	 * @param {boolean} [isNeg] The boolean to indicate that the running test case is negative.
	 */
	createNewDeck(deckObj, isNeg = false) {
		const apiOptions = { url: '' }
		let newDeckUrl = 'api/deck/new/'

		if (deckObj.cards) {
			// Make a new partial deck using the card IDs in the 'cards' attribute and save its deck ID.
			cy.step('Make new partial deck')
			newDeckUrl += `?cards=${deckObj.cards}`
		} else {
			cy.step('Make new deck')

			// Additional sub directory for shuffling the new deck.
			if (deckObj.shuffled) {
				newDeckUrl += 'shuffle/'
			}

			// Query parameters for multiple decks and/or enabling joker cards.
			if (typeof deckObj.deckCount === 'number' && deckObj.jokersEnabled) {
				newDeckUrl += `?deck_count=${deckObj.deckCount}&jokers_enabled=true`
			} else if (typeof deckObj.deckCount === 'number') {
				newDeckUrl += `?deck_count=${deckObj.deckCount}`
			} else if (deckObj.jokersEnabled) {
				newDeckUrl += `?jokers_enabled=true`
			}
		}

		apiOptions.url = newDeckUrl

		if (isNeg) {
			apiOptions.failOnStatusCode = false
		}

		cy.api(apiOptions).as('newDeckResp')
	}

	/**
	 * Draw a card from a deck based on the given deck ID and card count.
	 * @param {string} deckId The ID of the deck.
	 * @param {number} drawCount The number of cards to be drawn as a
	 * positive, whole number.
	 * @param {boolean} [isNeg] The boolean to indicate that the running test case is negative.
	 */
	drawCardsFromDeck(deckId, drawCount, isNeg = false) {
		const drawDeckCardUrl = `api/deck/${deckId}/draw/?count=${Math.trunc(drawCount)}`
		const apiOptions = { url: drawDeckCardUrl }

		if (isNeg) {
			apiOptions.failOnStatusCode = false
		}

		cy.step(`Drawing ${drawCount} card(s) from deck ID ${deckId}`)
		cy.api(apiOptions).as('recentDrawDeckResp')
	}

	/**
	 * Shuffle a deck of cards.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} [remaining] Set this to true to shuffle cards only in
	 * main stack while ignoring any piles or drawn cards (optional).
	 */
	shuffleDeck(deckId, remaining = ``) {
		let shuffleDeckUrl = `api/deck/${deckId}/shuffle/`
		let stepMessage = `Shuffle deck ID ${deckId}`

		/* Setting the string for "remaining" to be empty omits the
		query paramter "remaining" in the URL. */
		if (remaining) {
			shuffleDeckUrl += `?remaining=${remaining}`
			stepMessage += ` with 'remaining' set to ${remaining}`
		}

		cy.step(stepMessage)
		cy.api(shuffleDeckUrl).as('recentShuffleDeckResp')
	}

	/**
	 * Add cards to a pile for a deck.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} pileName The name of the pile from the deck.
	 * @param {string} cards The cards to be put in the pile as a
	 * comma-separated string of card codes.
	 */
	addCardsToPile(deckId, pileName, cards) {
		const addPileCardsUrl = `api/deck/${deckId}/pile/${pileName}/add/?cards=${cards}`

		cy.step(`Adding cards ${cards} from deck id ${deckId} in pile ${pileName}`)
		cy.api(addPileCardsUrl).as('recentAddPileResp')
	}

	/**
	 * Shuffle a pile from a deck.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} pileName The name of the pile from the deck.
	 */
	shufflePile(deckId, pileName) {
		const shufflePileUrl = `api/deck/${deckId}/pile/${pileName}/shuffle/`

		cy.step(`Shuffle pile ${pileName} from deck id ${deckId}`)
		cy.api(shufflePileUrl).as('recentShufflePileResp')
	}

	/**
	 * List the cards in a pile from a deck.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} pileName The name of the pile from the deck.
	 */
	listCardsInPile(deckId, pileName) {
		const listPileCardsUrl = `api/deck/${deckId}/pile/${pileName}/list/`

		cy.step(`Listing cards in pile ${pileName} from deck id ${deckId}`)
		cy.api(listPileCardsUrl).as('recentListPileResp')
	}

	/**
	 * Draw cards in a pile from a deck by using card codes or card count.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} pileName The name of the pile from the deck.
	 * @param {string | number} cardsToGet Either get specific cards from a pile using
	 * a string of comma-separated card codes or some number of cards using a number.
	 * @param {string} [drawAct] Set as either "bottom" to draw a card from the bottom
	 * of the pile or "random" to draw a random card from a pile (optional).
	 * @param {boolean} [isNeg] The boolean to indicate that the running test case is negative.
	 */
	drawCardsFromPile(deckId, pileName, cardsToGet, drawAct = '', isNeg) {
		let drawPileCardUrl = `api/deck/${deckId}/pile/${pileName}/draw/`
		let apiOptions

		if (drawAct) {
			drawPileCardUrl += `${drawAct}/`
		}

		switch (typeof cardsToGet) {
			case 'string':
				drawPileCardUrl += `?cards=${cardsToGet}`
				break
			case 'number':
				drawPileCardUrl += `?count=${Math.trunc(cardsToGet)}`
				break
		}

		apiOptions = { url: drawPileCardUrl }

		if (isNeg) {
			apiOptions.failOnStatusCode = false
		}

		cy.step(`Draw card(s) from deck id ${deckId} in pile ${pileName}`)
		cy.api(apiOptions).as('recentDrawPileResp')
	}

	/**
	 * Return the cards that are drawn back to the deck.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} [cards] The cards to be put in the pile as a
	 * comma-separated string of card codes (optional).
	 */
	returnDrawnCards(deckId, cards = '') {
		let returnCardsUrl = `api/deck/${deckId}/return/`

		if (cards) {
			returnCardsUrl += `?cards=${cards}`
		}

		cy.step(`Return cards that are drawn to deck id ${deckId}`)
		cy.api(returnCardsUrl).as('recentReturnCardsResp')
	}

	/**
	 * Return the cards that are in a pile back to the deck.
	 * @param {string} deckId The ID of the deck.
	 * @param {string} pileName The name of the pile from the deck.
	 * @param {string} [cards] The cards to be put in the pile as a
	 * comma-separated string of card codes (optional).
	 */
	returnPileCards(deckId, pileName, cards = '') {
		let returnCardsUrl = `api/deck/${deckId}/pile/${pileName}/return/`

		if (cards) {
			returnCardsUrl += `?cards=${cards}`
		}

		cy.step(`Return cards from pile ${pileName} to deck id ${deckId}`)
		cy.api(returnCardsUrl).as('recentReturnCardsResp')
	}
}

export default Object.freeze(new DeckHandler())
