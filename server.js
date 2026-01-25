const express = require('express')
const path = require('path')

const website = express()
const portNum = 3000

// Get and serve custom website files in github_pages
website.use(express.static(path.join(__dirname, 'github_pages')))

// Create the route handler for the website
website.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'github_pages', 'index.html'))
})

// Fallback for undefined routes
website.use((req, res) => {
	res.status(404).send('404 Not Found')
})

// Announce on the terminal that the website is running
website.listen(portNum, () => {
	console.log(`Server is running on http://localhost:${portNum}`)
})
