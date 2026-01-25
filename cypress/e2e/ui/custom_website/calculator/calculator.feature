Feature: Calculator
	Background: Load the calculator page
		Given I visit the calculator page

	Scenario: Check title
		When I load the calculator page at the correct the sub directory
		Then I should see the title of the web page as "Calculator"

	Scenario Outline: Check text
		When I see an element with the data-cy attribute "<dataCy>"
		Then I should see the expected text "<expText>" from that element
		Examples:
			| dataCy             | expText                                                 |
			| calc-nav-home-link | Home                                                    |
			| calc-nav-calc-link | Calculator                                              |
			| calc-nav-text-link | Text to File                                            |
			| calc-header        | Calculator                                              |
			| calc-tagline       | A simple calculator app to test simple math operations! |

	Scenario: Check footer text
		When I see the footer element where the footer text has the data-cy attribute "calc-footer-text"
		Then I should see the expected text "© 2025 by Alben Trang" and the email address "albentrang@gmail.com"

	Scenario Outline: Check links
		When I see clickable text with the data-cy attribute "<dataCy>"
		Then I should expect the link to reference the correct URL "<url>" of the custom website or an external website
		Examples:
			| dataCy                    | url                                             |
			| calc-nav-home-link        | index.html                                      |
			| calc-nav-calc-link        | calculator.html                                 |
			| calc-nav-text-link        | text_to_file.html                               |
			| calc-footer-linkedin-link | https://www.linkedin.com/in/albentrang/         |
			| calc-footer-github-link   | https://github.com/albentrang/cypress-portfolio |

	Scenario Outline: Check element hover effects
		When I hover over the element with the data-cy attribute "<dataCy>"
		And I see the element's background color change to these RGB values: <r>, <g>, <b>
		And I stop hovering over the element
		Then I should see the element's background color revert back to its original color
		Examples:
			| dataCy             | r   | g   | b   |
			| calc-nav-home-link | 233 | 150 | 122 |
			| calc-nav-calc-link | 233 | 150 | 122 |
			| calc-nav-text-link | 233 | 150 | 122 |
			| btn-clear          | 0   | 0   | 0   |
			| btn-clear-entry    | 0   | 0   | 0   |
			| btn-modulo         | 0   | 0   | 0   |
			| btn-divide         | 0   | 0   | 0   |
			| btn-7              | 0   | 0   | 0   |
			| btn-8              | 0   | 0   | 0   |
			| btn-9              | 0   | 0   | 0   |
			| btn-multiply       | 0   | 0   | 0   |
			| btn-4              | 0   | 0   | 0   |
			| btn-5              | 0   | 0   | 0   |
			| btn-6              | 0   | 0   | 0   |
			| btn-subtract       | 0   | 0   | 0   |
			| btn-1              | 0   | 0   | 0   |
			| btn-2              | 0   | 0   | 0   |
			| btn-3              | 0   | 0   | 0   |
			| btn-add            | 0   | 0   | 0   |
			| btn-sign-change    | 0   | 0   | 0   |
			| btn-0              | 0   | 0   | 0   |
			| btn-decimal        | 0   | 0   | 0   |
			| btn-equals         | 0   | 0   | 0   |

	Scenario: Cannot modify calculator display directly
		When I try to type directly into the calculator display with the data-cy attribute "calc-display"
		Then I should see that the value of the calculator display remains unchanged at "0"

	Scenario Outline: Enter numbers into the calculator
		When I enter "<number>" into the calculator
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| number     | result     |
			| 0          | 0          |
			| 5          | 5          |
			| 123        | 123        |
			| -12345     | -12345     |
			| 9999999999 | 9999999999 |
			| -999999999 | -999999999 |
			| 1234567890 | 1234567890 |
			| -123456789 | -123456789 |
			| 1.23456789 | 1.23456789 |
			| -1.2345678 | -1.2345678 |
			| 0.1        | 0.1        |
			| .1         | 0.1        |
			| -0.1       | -0.1       |
			| -.1        | -0.1       |
			| 0.01       | 0.01       |
			| .01        | 0.01       |
			| -0.01      | -0.01      |
			| -.01       | -0.01      |
			| 0.001      | 0.001      |
			| .001       | 0.001      |
			| -0.001     | -0.001     |
			| -.001      | -0.001     |
			| 0.0001     | 0.0001     |
			| .0001      | 0.0001     |
			| -0.0001    | -0.0001    |
			| -.0001     | -0.0001    |
			| 0.00001    | 0.00001    |
			| .00001     | 0.00001    |
			| -0.00001   | -0.00001   |
			| -.00001    | -0.00001   |
			| 0.000001   | 0.000001   |
			| .000001    | 0.000001   |
			| -0.000001  | -0.000001  |
			| -.000001   | -0.000001  |
			| 0.0000001  | 0.0000001  |
			| .0000001   | 0.0000001  |
			| -0.0000001 | -0.0000001 |
			| -.0000001  | -0.0000001 |
			| 0.00000001 | 0.00000001 |
			| .00000001  | 0.00000001 |

	Scenario Outline: Add two numbers using the calculator
		When I enter "<num1>" and "<num2>" and press +
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1       | num2       | result     |
			| 1          | 2          | 3          |
			| 0          | 0          | 0          |
			| -1         | 1          | 0          |
			| 9999999999 | 1          | 9999999999 |
			| 1234567890 | 987654321  | 2222222211 |
			| -999999999 | 1          | -999999998 |
			| 0.1        | 0.2        | 0.3        |
			| 99999999.9 | 0.1        | 100000000  |
			| -0.1       | -0.2       | -0.3       |
			| 123456789  | 876543211  | 1000000000 |
			| 0          | 9999999999 | 9999999999 |
			| -999999999 | 999999999  | 0          |
			| 5          | -5         | 0          |
			| 0.00000001 | 0.00000009 | 0.0000001  |
			| -0.0000001 | -0.0000009 | -0.000001  |
			| 9999999999 | 9999999999 | 9999999999 |

	Scenario Outline: Subtract two numbers using the calculator
		When I enter "<num1>" and "<num2>" and press -
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1       | num2       | result     |
			| 5          | 2          | 3          |
			| 0          | 0          | 0          |
			| -1         | 1          | -2         |
			| 9999999999 | 1          | 9999999998 |
			| 1234567890 | 987654321  | 246913569  |
			| -999999999 | 1          | -999999999 |
			| 0.3        | 0.2        | 0.1        |
			| 100000000  | 0.1        | 99999999.9 |
			| -0.3       | -0.2       | -0.1       |
			| 123456789  | 87654321   | 35802468   |
			| 0          | 9999999999 | -999999999 |
			| -999999999 | 999999999  | -999999999 |
			| 5          | -5         | 10         |
			| 0.0000001  | 0.00000009 | 0.00000001 |
			| -0.000001  | -0.0000009 | -0.0000001 |
			| 9999999999 | 9999999999 | 0          |

	Scenario Outline: Multiply two numbers using the calculator
		When I enter "<num1>" and "<num2>" and press x
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1       | num2       | result     |
			| 2          | 3          | 6          |
			| -2         | 3          | -6         |
			| 0          | 1234567890 | 0          |
			| 1          | 9999999999 | 9999999999 |
			| 9999999999 | 1          | 9999999999 |
			| -999999999 | 1          | -999999999 |
			| 0.1        | 0.2        | 0.02       |
			| 0.00000001 | 100000000  | 1          |
			| 9999999999 | 2          | 9999999999 |
			| -999999999 | -2         | 1999999998 |
			| 123456789  | 87654321   | 9999999999 |
			| 0.0000001  | 0.0000001  | 0          |
			| -0.0000001 | 0.0000001  | 0          |
			| 9999999999 | 9999999999 | 9999999999 |
			| 1000000000 | 10         | 9999999999 |
			| 999999999  | 10         | 9999999990 |
			| 1.23456789 | 9.87654321 | 12.1932631 |

	Scenario Outline: Divide two numbers using the calculator
		When I enter "<num1>" and "<num2>" and press ÷
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1        | num2       | result     |
			| 10          | 2          | 5          |
			| 1           | 3          | 0.33333333 |
			| 1           | 6          | 0.16666666 |
			| 1000000000  | 1          | 1000000000 |
			| 9999999999  | 1          | 9999999999 |
			| 9999999999  | 9          | 1111111111 |
			| 9999999999  | 9999999999 | 1          |
			| -999999999  | 1          | -999999999 |
			| 1           | -2         | -0.5       |
			| -1          | -2         | 0.5        |
			| 0           | 1          | 0          |
			| 1           | 0          | Error      |
			| 0.00000001  | 1          | 0.00000001 |
			| 1           | 0.00000001 | 100000000  |
			| 1234567890  | 2          | 617283945  |
			| 1.23456789  | 3          | 0.41152263 |
			| 9999999999  | 3          | 3333333333 |
			| 9999999999  | 9999999998 | 1          |
			| 0.00000001  | 10         | 0          |
			| -0.00000001 | 10         | 0          |

	Scenario Outline: Get the remainder of two numbers using the calculator
		When I enter "<num1>" and "<num2>" and press %
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1        | num2        | result     |
			| 10          | 3           | 1          |
			| 1000000000  | 3           | 1          |
			| 9999999999  | 2           | 1          |
			| 9999999999  | 9999999998  | 1          |
			| 9999999999  | 9999999999  | 0          |
			| 1234567890  | 1000000000  | 234567890  |
			| 1           | 0.3         | 0.1        |
			| 0.12345678  | 0.1         | 0.02345678 |
			| 0.00000001  | 0.00000009  | 0.00000001 |
			| -10         | 3           | 2          |
			| 10          | -3          | -2         |
			| -10         | -3          | -1         |
			| 0           | 3           | 0          |
			| 3           | 0           | Error      |
			| 9999999999  | 1           | 0          |
			| 1           | 9999999999  | 1          |
			| 0.00000001  | 1           | 0.00000001 |
			| 1           | 0.00000001  | 0.00000001 |
			| -0.00000001 | 0.00000001  | 0          |
			| 0.00000001  | -0.00000001 | 0          |

	Scenario Outline: The correct numbers appear in the results bar when one number and one operation are entered
		When I enter "<num1>" and press "<op>"
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1       | op       | result     |
			| 10         | add      | 20         |
			| -10        | add      | -20        |
			| 0          | add      | 0          |
			| 0.1        | add      | 0.2        |
			| -0.1       | add      | -0.2       |
			| 5000000000 | add      | 9999999999 |
			| -500000000 | add      | -999999999 |
			| 20         | subtract | 0          |
			| -20        | subtract | 0          |
			| 0          | subtract | 0          |
			| 0.2        | subtract | 0          |
			| -0.2       | subtract | 0          |
			| 9999999999 | subtract | 0          |
			| -999999999 | subtract | 0          |
			| 5          | multiply | 25         |
			| -5         | multiply | 25         |
			| 0          | multiply | 0          |
			| 0.2        | multiply | 0.04       |
			| -0.2       | multiply | 0.04       |
			| 999999999  | multiply | 9999999999 |
			| -999999999 | multiply | 9999999999 |
			| 100        | divide   | 1          |
			| -100       | divide   | 1          |
			| 0          | divide   | Error      |
			| 0.1        | divide   | 1          |
			| -0.1       | divide   | 1          |
			| 9999999999 | divide   | 1          |
			| -999999999 | divide   | 1          |
			| 10         | modulo   | 0          |
			| -10        | modulo   | 0          |
			| 0          | modulo   | Error      |
			| 0.1        | modulo   | 0          |
			| -0.1       | modulo   | 0          |
			| 9999999999 | modulo   | 0          |
			| -999999999 | modulo   | 0          |

	Scenario Outline: Calculate with three numbers and two operations using the calculator
		When I enter "<num1>", press "<op1>", enter "<num2>", press "<op2>", and enter "<num3>"
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1 | op1      | num2 | op2      | num3 | result |
			| 10   | add      | 20   | add      | 30   | 60     |
			| 10   | add      | 20   | subtract | 5    | 25     |
			| 10   | add      | 20   | multiply | 2    | 60     |
			| 10   | add      | 20   | divide   | 2    | 15     |
			| 10   | add      | 20   | modulo   | 3    | 0      |
			| 10   | subtract | 20   | add      | 5    | -5     |
			| 10   | subtract | 20   | subtract | 5    | -15    |
			| 10   | subtract | 20   | multiply | 2    | -20    |
			| 10   | subtract | 20   | divide   | 2    | -5     |
			| 10   | subtract | 20   | modulo   | 3    | 2      |
			| 10   | multiply | 2    | add      | 5    | 25     |
			| 10   | multiply | 2    | subtract | 5    | 15     |
			| 10   | multiply | 2    | multiply | 3    | 60     |
			| 10   | multiply | 2    | divide   | 4    | 5      |
			| 10   | multiply | 2    | modulo   | 3    | 2      |
			| 10   | divide   | 2    | add      | 5    | 10     |
			| 10   | divide   | 2    | subtract | 5    | 0      |
			| 10   | divide   | 2    | multiply | 3    | 15     |
			| 10   | divide   | 2    | divide   | 5    | 1      |
			| 10   | divide   | 2    | modulo   | 3    | 2      |
			| 10   | modulo   | 3    | add      | 2    | 3      |
			| 10   | modulo   | 3    | subtract | 2    | -1     |
			| 10   | modulo   | 3    | multiply | 2    | 2      |
			| 10   | modulo   | 3    | divide   | 2    | 0.5    |
			| 10   | modulo   | 3    | modulo   | 2    | 1      |
			| -10  | add      | 20   | multiply | -2   | -20    |
			| 5.5  | multiply | 2    | subtract | 1.5  | 9.5    |
			| 100  | divide   | 4    | add      | 25   | 50     |
			| -50  | subtract | 25   | divide   | 5    | -15    |
			| 0    | add      | 0    | multiply | 0    | 0      |
			| 100  | modulo   | 33   | add      | 10   | 11     |
			| 99.9 | subtract | 99.9 | add      | 99.9 | 99.9   |
			| 10   | multiply | 0    | add      | 5    | 5      |
			| 10   | divide   | 0    | add      | 5    | 5      |
			| 10   | modulo   | 0    | add      | 5    | 5      |

	Scenario Outline: Enter one number, clear entry, and then enter a new number so that the results bar should only show the new number
		When I enter "<num1>", press CE, and enter "<num2>"
		And I press =
		Then I should see the calculator display show "<num2>"
		Examples:
			| num1 | num2 |
			| 123  | 456  |
			| 999  | 0    |
			| -50  | 25   |
			| 0.75 | 0.25 |

	Scenario Outline: Enter one number, then the operation, then the next number, then clear entry, and then enter a new number so that the results bar should show the result of the first number and operation with the new number
		When I enter "<num1>", press "<op>", enter "<num2>", press CE, and enter "<num3>"
		And I press =
		Then I should see the calculator display show "<result>"
		Examples:
			| num1 | num2 | op       | num3 | result |
			| 10   | 20   | add      | 5    | 15     |
			| 50   | 25   | subtract | 10   | 40     |
			| 5    | 4    | multiply | 2    | 10     |
			| 100  | 20   | divide   | 4    | 25     |
			| 10   | 3    | modulo   | 2    | 0      |

	Scenario Outline: Enter two numbers, press the clear button, and then do two new numbers so that the results bar should only show the result of the second calculation
		When I enter "<num1a>", press "<op>", enter "<num2a>", press C, enter "<num1b>", press "<op>", and enter "<num2b>"
		And I press =
		Then I should see the calculator display show "<resultb>"
		Examples:
			| num1a | num2a | op       | num1b | num2b | resultb |
			| 10    | 20    | add      | 5     | 5     | 10      |
			| 50    | 25    | subtract | 30    | 10    | 20      |
			| 5     | 4     | multiply | 3     | 3     | 9       |
			| 100   | 20    | divide   | 80    | 4     | 20      |
			| 10    | 3     | modulo   | 14    | 5     | 4       |

	Scenario: Clicking the negate button twice should return the number to its original value
		When I enter a number like "12345" into the calculator
		And I press the sign change button twice
		And I press =
		Then I should see the calculator display show "12345"

	Scenario: Clicking the decimal button twice should not add a second decimal point to the number
		When I first enter a number like "1" into the calculator
		* I press the decimal button
		* I enter more numbers like "23"
		* I press the decimal button again
		* I press =
		Then I should see the calculator display show "1.23"
