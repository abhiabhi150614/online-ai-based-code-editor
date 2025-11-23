// ------------------------------------------------------------
// SAFE MULTI-LANGUAGE CODE EXECUTION SERVER (WebSocket)
// ------------------------------------------------------------
const { spawn } = require("child_process");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

// ------------------- CONFIG -------------------
const PORT = 3002;

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://68273061b3780e74acaca3d2--animated-custard-b1a884.netlify.app"
];

const EXEC_TIMEOUT = 8000; // ms (8 sec max)
const TMP_DIR = os.tmpdir();

// ------------------- SERVER -------------------
const wss = new WebSocket.Server({ port: PORT });

console.log(`⚡ Code Runner WebSocket running at ws://localhost:${PORT}`);

// Add CORS headers
wss.on("headers", (headers, req) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers.push(`Access-Control-Allow-Origin: ${origin}`);
  }
});

// ------------------- UTIL: Generate Temp File -------------------
function createTempFile(ext, content) {
  const id = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  const file = path.join(TMP_DIR, `tmp_${id}.${ext}`);
  fs.writeFileSync(file, content, "utf8");
  return file;
}

// ------------------- UTIL: Safe Cleanup -------------------
function cleanup(paths) {
  for (const p of paths) {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

// ------------------- CONNECTION -------------------
wss.on("connection", (ws) => {
  let proc = null;
  let cleanupList = [];
  let timeout = null;
  let running = false;

  // ------------------------------------
  // Handle Incoming WebSocket Messages
  // ------------------------------------
  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return ws.send(JSON.stringify({ type: "error", error: "Invalid JSON" })); }

    // RUN CODE REQUEST
    if (msg.type === "run") {
      const { language, code } = msg;

      if (running) {
        ws.send(JSON.stringify({
          type: "error",
          error: "A program is still running. Please wait."
        }));
        return;
      }

      // Reset
      running = true;
      cleanup(cleanupList);
      cleanupList = [];
      if (proc) proc.kill();
      proc = null;

      try {
        let command, args = [];

        // -----------------------------
        // PYTHON
        // -----------------------------
        if (language === "python") {
          const file = createTempFile("py", code);
          cleanupList.push(file);
          command = "python";
          args = [file];
        }

        // -----------------------------
        // JAVASCRIPT
        // -----------------------------
        else if (language === "javascript") {
          const file = createTempFile("js", code);
          cleanupList.push(file);
          command = "node";
          args = [file];
        }

        // -----------------------------
        // JAVA
        // -----------------------------
        else if (language === "java") {
          const javaFile = createTempFile("java", code.replace(/public\s+class\s+\w+/, "public class Main"));
          const classFile = path.join(TMP_DIR, "Main.class");
          cleanupList.push(javaFile, classFile);

          await new Promise((res, rej) => {
            const compile = spawn("javac", [javaFile], { cwd: TMP_DIR });
            let err = "";

            compile.stderr.on("data", d => err += d.toString());
            compile.on("close", c => c === 0 ? res() : rej(new Error(err)));
          });

          command = "java";
          args = ["-cp", TMP_DIR, "Main"];
        }

        // -----------------------------
        // C++
        // -----------------------------
        else if (language === "cpp") {
          const cppFile = createTempFile("cpp", code);
          const exeFile = process.platform === "win32" ?
            cppFile.replace(".cpp", ".exe") :
            cppFile.replace(".cpp", ".out");

          cleanupList.push(cppFile, exeFile);

          await new Promise((res, rej) => {
            const compile = spawn("g++", [cppFile, "-O2", "-o", exeFile]);
            let err = "";
            compile.stderr.on("data", d => err += d.toString());
            compile.on("close", c => c === 0 ? res() : rej(new Error(err)));
          });

          command = exeFile;
        }

        else {
          throw new Error("Unsupported language");
        }

        // -----------------------------
        // EXECUTE PROGRAM
        // -----------------------------
        proc = spawn(command, args, { cwd: TMP_DIR });

        // ---- STDOUT
        proc.stdout.on("data", (d) => {
          ws.send(JSON.stringify({ type: "stdout", data: d.toString() }));
        });

        // ---- STDERR
        proc.stderr.on("data", (d) => {
          ws.send(JSON.stringify({ type: "stderr", data: d.toString() }));
        });

        // ---- EXIT
        proc.on("close", (code) => {
          ws.send(JSON.stringify({ type: "exit", code }));
          cleanup(cleanupList);
          cleanupList = [];
          running = false;
        });

        // ---- Safety Timeout
        timeout = setTimeout(() => {
          if (proc) proc.kill();
          ws.send(JSON.stringify({
            type: "error",
            error: "Program timed out after 8 seconds"
          }));
          cleanup(cleanupList);
          running = false;
        }, EXEC_TIMEOUT);

      } catch (err) {
        ws.send(JSON.stringify({ type: "error", error: err.message }));
        cleanup(cleanupList);
        running = false;
      }
    }

    // SEND INPUT TO PROGRAM
    else if (msg.type === "input" && proc) {
      proc.stdin.write(msg.data + "\n");
    }

    // FORCE KILL
    else if (msg.type === "kill" && proc) {
      proc.kill();
      cleanup(cleanupList);
      cleanupList = [];
      running = false;
      ws.send(JSON.stringify({ type: "exit", code: "manual_kill" }));
    }
  });

  // When Client Disconnects
  ws.on("close", () => {
    if (proc) proc.kill();
    if (timeout) clearTimeout(timeout);
    cleanup(cleanupList);
  });
});
