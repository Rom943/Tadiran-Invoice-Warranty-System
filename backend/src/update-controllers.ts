// This is a helper script to update all controller files to remove 'return' statements before res.xxx() calls
// Run this with ts-node update-controllers.ts

import * as fs from 'fs';
import * as path from 'path';

const controllersDir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(controllersDir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace return res.xxx() patterns with res.xxx()
    content = content.replace(/return\s+res\.(status|json|send|end|cookie|clearCookie)/g, 'res.$1');
    
    // Add Promise<void> return type to all async controller methods
    content = content.replace(
      /export const \w+ = async \(req: Request, res: Response\)(\s+=>\s+{)/g, 
      'export const $1 = async (req: Request, res: Response): Promise<void>$2'
    );

    // Fix non-async methods too
    content = content.replace(
      /export const \w+ = \(req: Request, res: Response\)(\s+=>\s+{)/g, 
      'export const $1 = (req: Request, res: Response): void$2'
    );
    
    // Replace return errorHandler with errorHandler
    content = content.replace(/return\s+errorHandler/g, 'errorHandler');

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
