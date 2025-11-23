// --------------------------------------------------------------
// SAFE MULTI-LANGUAGE CODE EXECUTION SERVER + GEMINI AI TUTOR
// --------------------------------------------------------------

const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

// --------------------------------------------------------------
// CORS
// --------------------------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://relaxed-starship-126758.netlify.app",
      "https://68273061b3780e74acaca3d2--animated-custard-b1a884.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// --------------------------------------------------------------
// Gemini Setup
// --------------------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --------------------------------------------------------------
// Util: Create Temp File
// --------------------------------------------------------------
function createTemp(ext, content) {
  const name = `tmp_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const full = path.join(os.tmpdir(), name);
  fs.writeFileSync(full, content, "utf8");
  return full;
}

// --------------------------------------------------------------
// Util: Cleanup Files
// --------------------------------------------------------------
function cleanFiles(files) {
  for (const f of files) {
    try {
      fs.unlinkSync(f);
    } catch (_) {}
  }
}

// --------------------------------------------------------------
// Util: Execute Code Safely With Timeout
// --------------------------------------------------------------
function executeCommand(command, args, input, cwd, timeout = 8000) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const proc = spawn(command, args, { cwd });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("Execution timed out (infinite loop or long process)."));
    }, timeout);

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}

// --------------------------------------------------------------
// Main Code Execution Handler
// --------------------------------------------------------------
async function executeCode(language, code, input) {
  const isWin = process.platform === "win32";
  let cleanup = [];

  try {
    // ------------------ PYTHON ------------------
    if (language === "python") {
      const file = createTemp("py", code);
      cleanup.push(file);
      return await executeCommand("python", [file], input, os.tmpdir());
    }

    // ------------------ JAVASCRIPT ------------------
    if (language === "javascript") {
      const file = createTemp("js", code);
      cleanup.push(file);
      return await executeCommand("node", [file], input, os.tmpdir());
    }

    // ------------------ JAVA ------------------
    if (language === "java") {
      const fixed = code.replace(/public\s+class\s+\w+/, "public class Main");
      const javaFile = createTemp("java", fixed);
      const classFile = javaFile.replace(".java", ".class");

      cleanup.push(javaFile, classFile);

      // Compile
      let compileRes = await executeCommand(
        "javac",
        [javaFile],
        null,
        os.tmpdir()
      );
      if (compileRes.code !== 0) return compileRes;

      // Execute
      return await executeCommand(
        "java",
        ["-cp", os.tmpdir(), "Main"],
        input,
        os.tmpdir()
      );
    }

    // ------------------ C++ ------------------
    if (language === "cpp") {
      const cppFile = createTemp("cpp", code);
      const exeFile = cppFile.replace(".cpp", isWin ? ".exe" : ".out");

      cleanup.push(cppFile, exeFile);

      // Compile
      let compileRes = await executeCommand(
        "g++",
        [cppFile, "-O2", "-o", exeFile],
        null,
        os.tmpdir()
      );
      if (compileRes.code !== 0) return compileRes;

      return await executeCommand(exeFile, [], input, os.tmpdir());
    }

    throw new Error("Unsupported language");
  } finally {
    cleanFiles(cleanup);
  }
}

// --------------------------------------------------------------
// In-memory recent runs
// --------------------------------------------------------------
const recentRuns = [];
const MAX_RECENT = 10;

// --------------------------------------------------------------
// Route: Code Runner
// --------------------------------------------------------------
app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  try {
    const result = await executeCode(language, code, input);

    recentRuns.unshift({
      language,
      code,
      input,
      result,
      timestamp: new Date(),
    });

    if (recentRuns.length > MAX_RECENT) recentRuns.pop();

    res.json(result);
  } catch (err) {
    const errorRun = {
      stdout: "",
      stderr: err.message,
      code: -1,
    };

    recentRuns.unshift({
      language,
      code,
      input,
      result: errorRun,
      timestamp: new Date(),
    });

    if (recentRuns.length > MAX_RECENT) recentRuns.pop();

    res.status(500).json(errorRun);
  }
});

// --------------------------------------------------------------
// Route: Gemini AI Tutor
// --------------------------------------------------------------
app.post("/tutor", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ error: "Missing Gemini API key" });

    const { prompt } = req.body;
    if (!prompt)
      return res.status(400).json({ error: "Prompt is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------
// Route: Recent Runs
// --------------------------------------------------------------
app.get("/recent-runs", (req, res) => {
  res.json(recentRuns);
});

// --------------------------------------------------------------
// Start Server
// --------------------------------------------------------------
app.listen(port, () => {
  console.log(`🚀 Code Runner & AI Tutor running on port ${port}`);
});
