import CalculatorPage from "./custom_website/page_objects/calculator_obj";
import TextToFilePage from "./custom_website/page_objects/text_to_file_obj";

const cyDownloadsFolder = Cypress.config("downloadsFolder");

// General custom commands for different projects.
/**
 * Get an element using its data-cy attribute.
 * @param {string} cyVal The value of the data-cy attribute.
 */
Cypress.Commands.add("getByCy", (cyVal, args = {}) => {
  return cy.get(`[data-cy="${cyVal}"]`, args);
});

// Custom commands for the custom website project.
Cypress.Commands.addAll({
  /**
   * Enter numbers and actions into the calculator.
   * @param {string[]} numStrings At least one number string.
   * @param {string[]} actions The actions to perform between the numbers. There is one fewer action than numbers.
   */
  calcEnterNumsAndActions(numStrings, actions) {
    const numCount = numStrings.length;
    const actionCount = actions.length;

    for (let i = 0; i < numCount; i++) {
      const numStr = numStrings[i];
      CalculatorPage.enterNumber(numStr);

      if (i < actionCount) {
        cy.calcEnterAction(actions[i]);
      }
    }
  },
  /**
   * Command to press an action button on the calculator.
   * @param {string} action The action to perform.
   */
  calcEnterAction(action) {
    switch (action.toLocaleLowerCase()) {
      case "add":
        CalculatorPage.pressAdd();
        break;
      case "subtract":
        CalculatorPage.pressSubtract();
        break;
      case "multiply":
        CalculatorPage.pressMultiply();
        break;
      case "divide":
        CalculatorPage.pressDivide();
        break;
      case "modulo":
        CalculatorPage.pressModulo();
        break;
      case "decimal":
        CalculatorPage.pressDecimal();
        break;
      case "signchange":
        CalculatorPage.pressSignChange();
        break;
      case "clear":
        CalculatorPage.pressClear();
        break;
      case "clearentry":
        CalculatorPage.pressClearEntry();
        break;
      case "equals":
        CalculatorPage.pressEquals();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  },
  /**
   * Command to verify the calculator result.
   * @param {string} expectedResult The expected result string.
   */
  verifyCalcResult(expectedResult) {
    CalculatorPage.getDisplayResult().then((displayText) => {
      cy.wrap(displayText).should("equal", expectedResult);
    });
  },
  /**
   * Command to type text into the Text to File text area.
   * @param {string} textToType The text to type into the text area.
   * @param {boolean} isJson Whether the text is JSON.
   */
  typeTextToFileArea(textToType, isJson = false) {
    const maxTextLen = TextToFilePage.maxTextAreaLength;

    // Remove any backslashes added by the Cucumber feature file.
    if (isJson) {
      textToType = textToType.replace(/\\/g, "");
    }

    TextToFilePage.typeIntoTextArea(textToType, isJson);

    // Replace the {enter} placeholder with actual new line characters for verification.
    textToType = textToType.replace(/{enter}/g, "\n");

    if (textToType.length > maxTextLen) {
      // Get the first 300 characters only.
      const first300Chars = textToType.substring(0, maxTextLen);

      TextToFilePage.textArea.should("have.value", first300Chars);
    } else {
      TextToFilePage.textArea.should("have.value", textToType);
    }
  },
  /**
   * Command to delete text from the Text to File text area.
   * @param {number} charCount The number of characters to delete.
   */
  deleteTextToFileArea(charCount) {
    // Store the current text area content length.
    TextToFilePage.textArea.invoke("val").as("beforeText");
    cy.get("@beforeText").then((text) => {
      const currentLength = text.length;
      const expLength = Math.max(0, currentLength - charCount);

      TextToFilePage.deleteFromTextArea(charCount);

      // Verify the new text area content length.
      TextToFilePage.textArea.invoke("val").as("afterText");
      cy.get("@afterText").then((afterText) => {
        cy.wrap(afterText.length).should("equal", expLength);
      });
    });
  },
  /**
   * Command to type text into the Text to File file name input.
   * @param {string} fileName The file name to type into the input.
   */
  typeTextToFileNameInput(fileName) {
    const maxInputLen = TextToFilePage.maxFileNameLength;

    TextToFilePage.typeIntoFileNameInput(fileName);
    if (fileName.length > maxInputLen) {
      // Get the first 30 characters only.
      const first30Chars = fileName.substring(0, maxInputLen);
      TextToFilePage.fileNameInput.should("have.value", first30Chars);
    } else {
      TextToFilePage.fileNameInput.should("have.value", fileName);
    }
  },
  /**
   * Command to delete text from the Text to File file name input.
   * @param {number} charCount The number of characters to delete.
   */
  deleteTextToFileNameInput(charCount) {
    // Store the current file name input content length.
    TextToFilePage.fileNameInput.invoke("val").as("beforeFileName");
    cy.get("@beforeFileName").then((fileName) => {
      const currentLength = fileName.length;
      const expLength = Math.max(0, currentLength - charCount);
      TextToFilePage.deleteFromFileNameInput(charCount);

      // Verify the new file name input content length.
      TextToFilePage.fileNameInput.invoke("val").as("afterFileName");
      cy.get("@afterFileName").then((afterFileName) => {
        cy.wrap(afterFileName.length).should("equal", expLength);
      });
    });
  },
  /**
   * Command to clear the Text to File text area and file name input.
   */
  clearTextToFileInputs() {
    TextToFilePage.clearTextAreaAndFileNameInput();
    TextToFilePage.textArea.should("have.value", "");
    TextToFilePage.fileNameInput.should("have.value", "");
  },
  /**
   * Command to select the Text to File file type from the dropdown menu.
   * @param {string} fileVal The file type value to select.
   */
  selectTextToFileType(fileVal) {
    TextToFilePage.selectFileType(fileVal);

    TextToFilePage.fileTypeSelect.find("option:selected").as("selectedOption");
    cy.get("@selectedOption").should("have.value", fileVal);
  },
  /**
   * Command to press the Text to File "Download" button.
   */
  pressTextToFileDownload() {
    TextToFilePage.clickDownloadButton();
  },
  /**
   * Command to verify the character count shown for the Text to File text area.
   * @param {number} expectedCount The expected character count.
   */
  verifyTextToFileAreaCharCount(expectedCount) {
    const expLabel = `Enter your text (${expectedCount}/300):`;

    TextToFilePage.textInputLabel.should("have.text", expLabel);
  },
  /**
   * Command to verify the character count for the file name input.
   * @param {number} expectedCount The expected character count.
   */
  verifyTextToFileNameInputCharCount(expectedCount) {
    const expLabel = `Enter file name (${expectedCount}/30):`;

    TextToFilePage.fileNameInputLabel.should("have.text", expLabel);
  },
  /**
   * Command to verify the downloaded file name and content.
   * @param {string} expectedFileName The expected file name with its extension of the downloaded file.
   * @param {string} expectedFileContent The expected content of the downloaded file.
   */
  verifyTextToFileDownload(expectedFileName, expectedFileContent) {
    // Verify the file is downloaded with the expected file name and content.
    const filePath = `${cyDownloadsFolder}/${expectedFileName}`;

    // Replace the {enter} placeholder with actual new line characters for verification.
    expectedFileContent = expectedFileContent.replace(/{enter}/g, "\n");

    cy.readFile(filePath, { timeout: 5000 }).then((fileContent) => {
      // Stringify JSON content for comparison if the selected file type was JSON.
      if (expectedFileName.endsWith(".json")) {
        // Remove any backslashes added by the Cucumber feature file.
        const expectedJson = JSON.parse(expectedFileContent.replace(/\\/g, ""));

        cy.wrap(fileContent).should("deep.equal", expectedJson);
      } else {
        cy.wrap(fileContent).should("equal", expectedFileContent);
      }
    });
  },
  /**
   * Command to verify an error message is shown on the Text to File page.
   * @param {string} expectedErrorMsg The expected error message shown.
   */
  verifyTextToFileErrorMessage(expectedErrorMsg) {
    TextToFilePage.errorMessage
      .should("be.visible")
      .and("have.text", expectedErrorMsg);
  },
  /**
   * Command to verify no error message is shown on the Text to File page.
   * @param {boolean} typeInFileName Set to true to type in the file name input. Otherwise, type in the text area instead.
   */
  verifyTextToFileNoErrorMessage(typeInFileName = false) {
    if (typeInFileName) {
      TextToFilePage.fileNameInput.focus();
    } else {
      TextToFilePage.textArea.focus();
    }
    cy.realType("A");
    TextToFilePage.errorMessage.should("not.be.visible");
  },
});
