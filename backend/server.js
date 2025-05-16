const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: ['https://68273061b3780e74acaca3d2--animated-custard-b1a884.netlify.app', 'http://localhost:5173','https://relaxed-starship-126758.netlify.app/'],
  methods: ['GET', 'POST'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory storage for recent runs
const recentRuns = [];
const MAX_RECENT_RUNS = 10;

// Helper function to execute code
async function executeCode(language, code, input) {
  let command, args;
  const fs = require('fs');
  const path = require('path');
  const isWin = process.platform === 'win32';
  let cleanupFiles = [];
  try {
    switch (language) {
      case 'python':
        command = 'python';
        args = ['-c', code];
        break;
      case 'javascript':
        command = 'node';
        args = ['-e', code];
        break;
      case 'java': {
        // Force class name to 'temp'
        let javaCode = code.replace(/public\s+class\s+([a-zA-Z0-9_]+)/, 'public class temp');
        const tempFile = 'temp.java';
        fs.writeFileSync(tempFile, javaCode);
        cleanupFiles.push(tempFile, 'temp.class');
        // Compile
        await new Promise((resolve, reject) => {
          const compile = spawn('javac', [tempFile]);
          let compileErr = '';
          compile.stderr.on('data', d => { compileErr += d.toString(); });
          compile.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Java compilation failed:\n' + compileErr));
          });
          compile.on('error', reject);
        });
        // Run
        command = 'java';
        args = ['temp'];
        break;
      }
      case 'cpp': {
        const cppFile = 'temp.cpp';
        const exeFile = isWin ? 'temp.exe' : 'temp.out';
        fs.writeFileSync(cppFile, code);
        cleanupFiles.push(cppFile, exeFile);
        // Compile
        await new Promise((resolve, reject) => {
          const compile = spawn('g++', [cppFile, '-o', exeFile]);
          let compileErr = '';
          compile.stderr.on('data', d => { compileErr += d.toString(); });
          compile.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('C++ compilation failed:\n' + compileErr));
          });
          compile.on('error', reject);
        });
        // Run
        command = isWin ? `./${exeFile}` : `./${exeFile}`;
        args = [];
        break;
      }
      default:
        throw new Error('Unsupported language');
    }

    return await new Promise((resolve, reject) => {
      const proc = spawn(command, args, { cwd: process.cwd() });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => { resolve({ stdout, stderr, code }); });
      proc.on('error', (err) => { reject(err); });
      if (input) {
        proc.stdin.write(input);
        proc.stdin.end();
      }
    });
  } finally {
    // Clean up temp files
    cleanupFiles.forEach(f => {
      try { fs.unlinkSync(f); } catch (e) {}
    });
  }
}

// Routes
app.post('/run', async (req, res) => {
  const { language, code, input } = req.body;
  let result;
  try {
    result = await executeCode(language, code, input);
    // Store in recent runs
    recentRuns.unshift({ language, code, input, result, timestamp: new Date() });
    if (recentRuns.length > MAX_RECENT_RUNS) {
      recentRuns.pop();
    }
    res.json(result);
  } catch (error) {
    // Save error run
    result = { stdout: '', stderr: error.message, code: 1 };
    recentRuns.unshift({ language, code, input, result, timestamp: new Date() });
    if (recentRuns.length > MAX_RECENT_RUNS) {
      recentRuns.pop();
    }
    res.status(500).json(result);
  }
});

app.post('/tutor', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not set in backend .env' });
    }
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ response: text });
  } catch (error) {
    res.status(500).json({ error: error.message || 'AI Tutor error' });
  }
});

app.get('/recent-runs', (req, res) => {
  res.json(recentRuns);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 
