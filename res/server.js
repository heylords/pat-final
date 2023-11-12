const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'slido.html'));
});

app.get('/loadContent', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
