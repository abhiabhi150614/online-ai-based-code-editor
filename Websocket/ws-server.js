const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const wss = new WebSocket.Server({ port: 3002 });

// CORS for WebSocket: Only allow connections from allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://68273061b3780e74acaca3d2--animated-custard-b1a884.netlify.app'
];
wss.on('headers', (headers, req) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    headers.push(`Access-Control-Allow-Origin: ${origin}`);
  }
});

wss.on('connection', function connection(ws) {
  let proc = null;
  let cleanupFiles = [];
  let busy = false;

  ws.on('message', async function incoming(message) {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'run') {
        if (busy) {
          ws.send(JSON.stringify({ type: 'error', error: 'Previous process still cleaning up. Please wait a moment and try again.' }));
          return;
        }
        busy = true;
        if (proc) {
          proc.kill();
          proc = null;
        }
        cleanupFiles.forEach(f => { try { fs.unlinkSync(f); } catch (e) {} });
        cleanupFiles = [];

        const { language, code } = msg;
        let command, args;
        const tempDir = os.tmpdir();
        const unique = Date.now() + '_' + crypto.randomBytes(6).toString('hex');

        if (language === 'python') {
          command = 'python';
          args = [];
          const tempFile = `temp_${unique}.py`;
          const absPath = path.join(tempDir, tempFile);
          fs.writeFileSync(absPath, code, { encoding: 'utf8' });
          args.push(absPath);
          cleanupFiles.push(absPath);
        } else if (language === 'javascript') {
          command = 'node';
          args = [];
          const tempFile = `temp_${unique}.js`;
          const absPath = path.join(tempDir, tempFile);
          fs.writeFileSync(absPath, code, { encoding: 'utf8' });
          args.push(absPath);
          cleanupFiles.push(absPath);
        } else if (language === 'java') {
          let javaCode = code.replace(/public\s+class\s+([a-zA-Z0-9_]+)/, 'public class temp');
          const tempFile = `temp_${unique}.java`;
          const absPath = path.join(tempDir, tempFile);
          fs.writeFileSync(absPath, javaCode, { encoding: 'utf8' });
          cleanupFiles.push(absPath, path.join(tempDir, 'temp.class'));
          await new Promise((resolve, reject) => {
            const compile = spawn('javac', [absPath], { cwd: tempDir });
            let compileErr = '';
            compile.stderr.on('data', d => { compileErr += d.toString(); });
            compile.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error('Java compilation failed:\n' + compileErr));
            });
            compile.on('error', reject);
          });
          command = 'java';
          args = ['-cp', tempDir, 'temp'];
        } else if (language === 'cpp') {
          const cppFile = `temp_${unique}.cpp`;
          const exeFile = process.platform === 'win32' ? `temp_${unique}.exe` : `temp_${unique}.out`;
          const absCpp = path.join(tempDir, cppFile);
          const absExe = path.join(tempDir, exeFile);
          fs.writeFileSync(absCpp, code, { encoding: 'utf8' });
          cleanupFiles.push(absCpp, absExe);
          await new Promise((resolve, reject) => {
            const compile = spawn('g++', [absCpp, '-o', absExe], { cwd: tempDir });
            let compileErr = '';
            compile.stderr.on('data', d => { compileErr += d.toString(); });
            compile.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error('C++ compilation failed:\n' + compileErr));
            });
            compile.on('error', reject);
          });
          command = absExe;
          args = [];
        } else {
          ws.send(JSON.stringify({ type: 'error', error: 'Unsupported language' }));
          busy = false;
          return;
        }

        proc = spawn(command, args, { cwd: tempDir });
        proc.stdout.on('data', (data) => {
          ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
        });
        proc.stderr.on('data', (data) => {
          ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
        });
        proc.on('close', (code) => {
          ws.send(JSON.stringify({ type: 'exit', code }));
          cleanupFiles.forEach(f => { try { fs.unlinkSync(f); } catch (e) {} });
          cleanupFiles = [];
          busy = false;
        });
        proc.on('error', (err) => {
          ws.send(JSON.stringify({ type: 'error', error: err.message }));
          busy = false;
        });
      } else if (msg.type === 'input' && proc) {
        proc.stdin.write(msg.data + '\n');
      } else if (msg.type === 'kill' && proc) {
        proc.kill();
        proc = null;
        busy = false;
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', error: e.message }));
      busy = false;
    }
  });

  ws.on('close', () => {
    if (proc) proc.kill();
    cleanupFiles.forEach(f => { try { fs.unlinkSync(f); } catch (e) {} });
    busy = false;
  });
});

console.log('WebSocket server running on ws://localhost:3002'); 