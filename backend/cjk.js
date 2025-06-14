const fs = require('fs');

// Path to your JSON key
const keyPath = './tadiranwarranty-aab02e26c107.json';

// Read and encode
const jsonKey = fs.readFileSync(keyPath, 'utf-8');
const base64Key = Buffer.from(jsonKey).toString('base64');

console.log(base64Key); // copy this to use in your env var
