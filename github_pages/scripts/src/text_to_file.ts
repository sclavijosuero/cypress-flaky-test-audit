// Handles text input and file download for the Text to File Downloader page
document.addEventListener('DOMContentLoaded', () => {
	const textInputLabel: HTMLLabelElement | null =
		document.querySelector('#text-input-label')
	const textArea: HTMLTextAreaElement | null =
		document.querySelector('#text-input-area')
	const fileNameLabel: HTMLLabelElement | null =
		document.querySelector('#file-name-label')
	const fileNameInput: HTMLInputElement | null =
		document.querySelector('#file-name-input')
	const fileTypeSelect: HTMLSelectElement | null =
		document.querySelector('#file-type-select')
	const downloadBtn: HTMLButtonElement | null =
		document.querySelector('#download-btn')
	const errorMsg: HTMLElement | null = document.querySelector('#error-message')

	// Check if all necessary elements are found
	if (
		!textInputLabel ||
		!textArea ||
		!fileNameLabel ||
		!fileNameInput ||
		!fileTypeSelect ||
		!downloadBtn ||
		!errorMsg
	) {
		console.error('One of the elements not found. Exiting script.')
		return
	}

	/**
	 * Validates if the input string is valid CSV.
	 * @param str The input string to validate.
	 * @returns True if the string is valid CSV, false otherwise.
	 */
	function isValidCsv(str: string): boolean {
		const lines: string[] = str.split('\n')
		if (!lines.length || !lines[0]) return false

		const numColumns: number = lines[0].split(',').length
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i]
			if (!line || line.split(',').length !== numColumns) {
				return false
			}
		}
		return true
	}

	/**
	 * Validates if the input string is valid JSON.
	 * @param str The input string to validate.
	 * @returns True if the string is valid JSON, false otherwise.
	 */
	function isValidJson(str: string): boolean {
		try {
			JSON.parse(str)
			return true
		} catch (e) {
			return false
		}
	}

	/**
	 * Show an error message in the UI.
	 * @param message The error message to display.
	 */
	function showError(message: string): void {
		if (errorMsg) {
			errorMsg.textContent = message
			errorMsg.style.padding = '10px'
		} else {
			console.error('Error element not found in the DOM.')
		}
	}

	/**
	 * Clear any existing error message from the UI.
	 */
	function clearError(): void {
		if (errorMsg) {
			errorMsg.textContent = ''
			errorMsg.style.padding = '0'
		} else {
			console.error('Error element not found in the DOM.')
		}
	}

	/**
	 * Returns the MIME type for a given file type.
	 * @param type The file type.
	 * @returns The MIME type for the specified file type.
	 */
	function getMimeType(type: string): string {
		switch (type) {
			case 'json':
				return 'application/json'
			case 'csv':
				return 'text/csv'
			case 'md':
				return 'text/markdown'
			case 'txt':
			default:
				return 'text/plain'
		}
	}

	/**
	 * Returns the file extension for a given file type.
	 * @param type The file type.
	 * @returns The file extension for the specified file type.
	 */
	function getFileExtension(type: string): string {
		switch (type) {
			case 'json':
				return 'json'
			case 'csv':
				return 'csv'
			case 'md':
				return 'md'
			case 'txt':
			default:
				return 'txt'
		}
	}

	// Update label counter when typing in text area
	textArea.addEventListener('input', () => {
		const count: number = textArea.value.length

		textInputLabel.textContent = `Enter your text (${count}/300):`
		clearError()
	})

	// Allow tabs in text area
	textArea.addEventListener('keydown', (e: KeyboardEvent) => {
		if (e.key === 'Tab') {
			e.preventDefault()

			const start: number = textArea.selectionStart
			const end: number = textArea.selectionEnd

			textArea.value =
				textArea.value.substring(0, start) +
				'\t' +
				textArea.value.substring(end)
			textArea.selectionStart = textArea.selectionEnd = start + 1
		}

		// Update label counter
		const count: number = textArea.value.length

		textInputLabel.textContent = `Enter your text (${count}/300):`
		clearError()
	})

	// Update label counter when typing in filename input
	fileNameInput.addEventListener('input', () => {
		const count: number = fileNameInput.value.length

		fileNameLabel.textContent = `Enter file name (${count}/30):`
		clearError()
	})

	// Handle download button click
	downloadBtn.addEventListener('click', () => {
		if (!textArea.value) {
			showError('Please enter some text to convert to a file.')
			return
		} else if (!fileNameInput.value) {
			showError('Please enter the name for the file.')
			return
		} else if (fileNameInput.value.match(/[^A-Za-z0-9_\-]+/)) {
			showError(
				'Please enter a valid file name (alphanumeric, hyphens, underscores).'
			)
			return
		} else if (fileTypeSelect.value == 'csv' && !isValidCsv(textArea.value)) {
			showError(
				'Please enter valid CSV. Ensure each column has the same number of values separated by commas.'
			)
			return
		} else if (
			fileTypeSelect.value === 'json' &&
			!isValidJson(textArea.value)
		) {
			showError('Please enter valid JSON. Ensure proper JSON syntax.')
			return
		}

		const text: string = textArea.value.slice(0, 300) // Enforce max length
		const fileName: string = fileNameInput.value.slice(0, 30) // Enforce max length
		const fileType: string = fileTypeSelect.value

		const mimeType: string = getMimeType(fileType)
		const extension: string = getFileExtension(fileType)
		const blob: Blob = new Blob([text], { type: mimeType })
		const url: string = URL.createObjectURL(blob)
		const a: HTMLAnchorElement = document.createElement('a')

		a.href = url
		a.download = `${fileName}.${extension}`
		document.body.appendChild(a)
		a.click()
		setTimeout(() => {
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		}, 100)
	})
})
