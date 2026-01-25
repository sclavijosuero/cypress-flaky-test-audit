Feature: Homepage
  Background: Load the homepage
    Given I visit the homepage

  Scenario: Check title
    When I load the homepage at the correct the sub directory
    Then I should see the title of the web page as "Homepage"

  Scenario Outline: Check text
    When I see an element with the data-cy attribute "<dataCy>"
    Then I should see the expected text "<expText>" from that element
    Examples:
      | dataCy                  | expText                                                                              |
      | home-nav-home-link      | Home                                                                                 |
      | home-nav-calc-link      | Calculator                                                                           |
      | home-nav-text-link      | Text to File                                                                         |
      | home-header             | Homepage                                                                             |
      | home-tagline            | My custom website to test various elements and interactions!                         |
      | test-pages-header       | Test Pages                                                                           |
      | test-pages-desc         | Explore different test pages to validate various features.                           |
      | test-pages-calc-link    | Calculator                                                                           |
      | test-pages-text-link    | Text to File                                                                         |
      | cy-test-results-header  | Cypress Test Results                                                                 |
      | cy-test-results-desc    | These Mochawesome test results are generated right before this website's deployment. |
      | custom-web-results-link | Custom Website Test Results                                                          |
      | deck-api-results-link   | Deck of Cards API Test Results                                                       |

  Scenario: Check footer text
    When I see the footer element where the footer text has the data-cy attribute "home-footer-text"
    Then I should see the expected text "© 2025 by Alben Trang" and the email address "albentrang@gmail.com"

  Scenario Outline: Check links
    When I see clickable text with the data-cy attribute "<dataCy>"
    Then I should expect the link to reference the correct URL "<url>" of the custom website or an external website
    Examples:
      | dataCy                    | url                                             |
      | home-nav-home-link        | index.html                                      |
      | home-nav-calc-link        | calculator.html                                 |
      | home-nav-text-link        | text_to_file.html                               |
      | test-pages-calc-link      | calculator.html                                 |
      | test-pages-text-link      | text_to_file.html                               |
      | custom-web-results-link   | custom-report.html                              |
      | deck-api-results-link     | deck-report.html                                |
      | home-footer-linkedin-link | https://www.linkedin.com/in/albentrang/         |
      | home-footer-github-link   | https://github.com/albentrang/cypress-portfolio |

  Scenario Outline: Check element hover effects
    When I hover over the element with the data-cy attribute "<dataCy>"
		And I see the element's background color change to these RGB values: <r>, <g>, <b>
		And I stop hovering over the element
		Then I should see the element's background color revert back to its original color
    Examples:
      | dataCy                  | r   | g   | b   |
      | home-nav-home-link      | 233 | 150 | 122 |
      | home-nav-calc-link      | 233 | 150 | 122 |
      | home-nav-text-link      | 233 | 150 | 122 |
      | test-pages-calc-btn     | 147 | 112 | 219 |
      | test-pages-text-btn     | 147 | 112 | 219 |
      | custom-web-results-link | 0   | 250 | 154 |
      | deck-api-results-link   | 0   | 250 | 154 |
