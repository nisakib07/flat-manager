
const fs = require('fs');
const path = require('path');
const logPath = path.join(process.cwd(), 'transfer_page_debug.log');
fs.writeFileSync(logPath, '', 'utf8');
console.log('Log file initialized as UTF-8');
