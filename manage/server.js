const express = require('express');
const fs = require('fs');
const { Keychain } = require('./password-manager');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the current directory

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

// Initialize a new keychain
app.post('/init', async (req, res) => {
    try {
        const { password } = req.body;
        const keychain = await Keychain.init(password);
        const data = await keychain.dump();
        fs.writeFileSync('keychain.json', data);
        res.status(200).json({ message: 'Keychain initialized', data });
    } catch (error) {
        res.status(500).json({ message: 'Error initializing keychain', error: error.message });
    }
});

// Load an existing keychain
app.post('/load', async (req, res) => {
    try {
        const { password } = req.body;
        const repr = fs.readFileSync('keychain.json', 'utf8');
        const keychain = await Keychain.load(password, repr);
        res.status(200).json({ message: 'Keychain loaded', keychain });
    } catch (error) {
        res.status(500).json({ message: 'Error loading keychain', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
