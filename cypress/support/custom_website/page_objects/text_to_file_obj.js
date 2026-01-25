let instance;

/**
 * Singleton object representing the Text to File page of my custom website.
 */
class TextToFilePage {
  #maxTextAreaLength;
  #maxFileNameLength;

  constructor() {
    if (!instance) {
      instance = this;
    }
    this.#maxTextAreaLength = 300;
    this.#maxFileNameLength = 30;
  }

  /**
   * Get the maximum allowed length for the text area.
   * @returns {number} The maximum length for the text area.
   */
  get maxTextAreaLength() {
    return this.#maxTextAreaLength;
  }

  /**
   * Get the maximum allowed length for the file name input.
   * @returns {number} The maximum length for the file name input.
   */
  get maxFileNameLength() {
    return this.#maxFileNameLength;
  }

  /**
   * Get the label for the text area.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The text area label element.
   */
  get textInputLabel() {
    return cy.getByCy("text-input-label");
  }

  /**
   * Get the text area element.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The text area element.
   */
  get textArea() {
    return cy.getByCy("text-input-area");
  }

  /**
   * Get the label for the file name input.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The file name input label element.
   */
  get fileNameInputLabel() {
    return cy.getByCy("file-name-label");
  }

  /**
   * Get the file name input element.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The file name input element.
   */
  get fileNameInput() {
    return cy.getByCy("file-name-input");
  }

  /**
   * Get the file type select dropdown element.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The file type select element.
   */
  get fileTypeSelect() {
    return cy.getByCy("file-type-select");
  }

  /**
   * Get the download button element.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The download button element.
   */
  get downloadButton() {
    return cy.getByCy("download-btn");
  }

  /**
   * Get the error message element.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} The error message element.
   */
  get errorMessage() {
    return cy.getByCy("error-message");
  }

  /**
   * Type into the text area.
   * @param {string} text - The text to type into the text area.
   * @param {boolean} isJson - Whether the text is JSON.
   */
  typeIntoTextArea(text, isJson = false) {
    // For JSON, disable special character parsing to allow typing characters like { and }.
    if (isJson) {
      this.textArea.type(text, {
        parseSpecialCharSequences: false,
      });
    } else {
      this.textArea.type(text);
    }
  }

  /**
   * Delete characters from the text area.
   * @param {number} charCount - The number of characters to delete. Needs to be greater than 0.
   */
  deleteFromTextArea(charCount) {
    if (charCount > 0) {
      this.textArea.type("{backspace}".repeat(charCount));
    }
  }

  /**
   * Type into the file name input field.
   * @param {string} fileName - The file name to type into the input field.
   */
  typeIntoFileNameInput(fileName) {
    this.fileNameInput.type(fileName);
  }

  /**
   * Delete characters from the file name input field.
   * @param {number} charCount - The number of characters to delete. Needs to be greater than 0.
   */
  deleteFromFileNameInput(charCount) {
    if (charCount > 0) {
      this.fileNameInput.type("{backspace}".repeat(charCount));
    }
  }

  /**
   * Clear the text area and file name input field.
   */
  clearTextAreaAndFileNameInput() {
    this.textArea.clear();
    this.fileNameInput.clear();
  }

  /**
   * Select a file type from the dropdown menu.
   * @param {string} fileVal - The value of the file type to select (e.g., 'txt', 'md', 'csv', or 'json').
   */
  selectFileType(fileVal) {
    this.fileTypeSelect.select(fileVal);
  }

  /**
   * Click the download button.
   */
  clickDownloadButton() {
    this.downloadButton.click();
  }
}

export default Object.freeze(new TextToFilePage());
