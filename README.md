# Full-Stack Online IDE (https://68271f840b25802a4fbf2a77--animated-longma-55e785.netlify.app/)

A modern, professional, web-based IDE with multi-language support, real-time terminal, AI-powered code assistance, and a beautiful, VS Code-inspired UI.   

---

## 🚀 Features

- **Multi-language Support:** Python, JavaScript, Java, C++ (auto-detects on file upload)
- **Monaco Editor:** Advanced code editing with syntax highlighting, minimap, split view, find/replace, and formatting
- **File Management:** Multi-file tabs, drag-and-drop reordering, rename, delete, upload/download, and new file modal
- **Real-Time Terminal:** xterm.js-based output panel with color, copy, download, and execution time
- **AI Assistance:**
  - **AI Tutor:** Explains code, errors, and suggests improvements (Gemini API)
  - **AI Write:** Generates/refactors code from prompts
  - **AI Chat:** Chat with AI about your code, with markdown/code rendering
  - **Inline AI:** Write `#ai` or `//ai` comments in the editor to trigger inline code generation
- **Theme & Layout:**
  - Light/Dark mode toggle
  - Font size controls
  - Responsive, desktop-grade layout with resizable panels and collapsible sidebar
  - Modern, VS Code-like UI/UX
- **Command Palette:** Quick actions (run, clear, theme, etc.) via Ctrl+P
- **Auto-save & Recovery:** Code is auto-saved to localStorage and restored on reload
- **Keyboard Shortcuts:** Run code, open palette, format, split editor, close tab, etc.
- **Status Bar:** Shows file, language, and status
- **Security:** Sandboxed code execution, CORS, and API key protection

---

## 🛠 Tech Stack

- **Frontend:**
  - React 19 + Vite
  - Mantine UI (modern, accessible components)
  - Monaco Editor (VS Code engine)
  - xterm.js (real-time terminal)
  - react-markdown (AI chat rendering)
  - @tabler/icons-react (icon set)
- **Backend:**
  - Node.js + Express
  - child_process.spawn for code execution (Python, JS, Java, C++)
  - Google Gemini API (AI Tutor/Write/Chat)
  - CORS, dotenv
- **Other:**
  - LocalStorage for persistence
  - .env for secrets

---

## 🏗️ Architecture

- **Frontend:**
  - Modular React components: EditorPane, FileTabs, HeaderBar, AISidebar, CommandPalette, etc.
  - State management via React hooks
  - Theme and layout handled with MantineProvider
- **Backend:**
  - `/run` endpoint: Compiles/runs code, returns stdout/stderr
  - `/tutor` endpoint: Sends prompt to Gemini API, returns AI response
  - In-memory recent runs
  - Sandboxed, temp files for Java/C++

---

## ⚡ Setup & Installation

### Prerequisites
- Node.js 16+
- npm
- Python 3.x
- Java JDK (javac)
- g++ (C++ compiler)
- Google Gemini API key

### 1. Clone the repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file:
```
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Running the Application
- **Start backend:**
  ```bash
  cd backend
  node server.js
  ```
- **Start frontend:**
  ```bash
  cd frontend
  npm run dev
  ```
- Open [http://localhost:5173](http://localhost:5173)

---

## 💻 Usage Guide
- **Switch language:** Use the dropdown in the header or per file tab
- **Add/rename/delete files:** Use the tab bar or right-click
- **Split view:** Use the split button for side-by-side editing
- **Theme:** Toggle with the sun/moon icon
- **Run code:** Click Run or press Ctrl+Enter
- **Input:** Enter stdin in the input box (or use inline input in the output panel if enabled)
- **Output:** See results, copy, or download
- **AI Tutor/Write/Chat:** Use the sidebar for explanations, code generation, or chat
- **Inline AI:** Type `#ai` or `//ai` comments in the editor and press Enter
- **Format code:** Click Format or use Ctrl+Shift+F
- **Find/replace:** Ctrl+F in the editor
- **Keyboard shortcuts:** See the shortcuts modal for a full list
- **Resizable panels:** Drag to resize editor/input/output/sidebar

---

## 🌐 Deployment Notes
- **Frontend:** Deploy on Netlify, Vercel, or any static host
- **Backend:**
  - For full language support (Java/C++), deploy on a VPS or Docker host with all compilers installed
  - Render/Heroku/etc. may not support system compilers (Java/C++)
  - Use `.env` for secrets
- **Security:**
  - Code execution is sandboxed but not fully isolated—do not expose to untrusted users without further hardening
  - API keys are never exposed to the frontend

---

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

---

## 📄 License
MIT 
