
const fs = require('fs');
const path = require('path');

try {
  const logPath = path.join(process.cwd(), 'transfer_page_debug.log');
  if (fs.existsSync(logPath)) {
      // Try reading as utf8 first, but handle potential utf16le if echo created it that way
      let content = fs.readFileSync(logPath);
      
      // extensive check for utf16le BOM or null bytes
      if (content.length > 2 && content[0] === 0xFF && content[1] === 0xFE) {
          console.log(content.toString('utf16le'));
      } else if (content.indexOf('\0') !== -1) {
          // likely utf16le without bom
          console.log(content.toString('utf16le'));
      } else {
          console.log(content.toString('utf8'));
      }
  } else {
    console.log('Log file not found');
  }
} catch (err) {
  console.error('Error reading log:', err);
}
