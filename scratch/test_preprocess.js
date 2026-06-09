import fs from 'fs';
import path from 'path';

const preprocessScript = (script, envConfig = {}) => {
  if (!script) return '';
  let processed = script.trim();

  // Strip markdown code block wraps and conversational text prefix
  const codeBlockRegex = /```(?:typescript|javascript|playwright|ts|js)?\s*([\s\S]*?)```/i;
  const match = processed.match(codeBlockRegex);
  if (match) {
    processed = match[1].trim();
  } else {
    const importIndex = processed.indexOf('import ');
    const testIndex = processed.indexOf('test(');
    const testDescribeIndex = processed.indexOf('test.describe(');
    
    const indices = [importIndex, testIndex, testDescribeIndex].filter(idx => idx !== -1);
    if (indices.length > 0) {
      const firstCodeIndex = Math.min(...indices);
      if (firstCodeIndex > 0) {
        processed = processed.substring(firstCodeIndex);
      }
    }
  }

  return processed;
};

const fileContent = fs.readFileSync('c:/Users/aryamol.m.DC/Desktop/assignment2/tests/tp_TC_001.spec.ts', 'utf-8');
console.log("Original content starts with:", JSON.stringify(fileContent.substring(0, 100)));
const cleaned = preprocessScript(fileContent);
console.log("Cleaned content starts with:", JSON.stringify(cleaned.substring(0, 100)));
