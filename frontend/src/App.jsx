import { useState, useEffect, useRef } from 'react';
import { MantineProvider, Textarea, Button, Group, ActionIcon, Tooltip } from '@mantine/core';
import EditorPane from './components/EditorPane';
import HeaderBar from './components/HeaderBar';
import AISidebar from './components/AISidebar';
import CommandPalette from './components/CommandPalette';
import FileTabs from './components/FileTabs';
import NewFileModal from './components/NewFileModal';
import { IconFiles, IconUpload, IconDownload, IconCopy, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import './App.css';

const FILES = [
  { name: 'main.py', language: 'python' },
  { name: 'main.js', language: 'javascript' },
  { name: 'main.cpp', language: 'cpp' },
  { name: 'main.java', language: 'java' },
];

const DEFAULT_CODE = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!")',
  java: 'public class temp { public static void main(String[] args) { System.out.println("Hello, World!"); } }',
  cpp: '#include <iostream>\nint main() { std::cout << "Hello, World!" << std::endl; return 0; }',
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('16');
  const [files, setFiles] = useState(FILES.map(f => ({ ...f, code: DEFAULT_CODE[f.language] })));
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [aiTutorResponse, setAiTutorResponse] = useState('');
  const [aiWriteResponse, setAiWriteResponse] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [status, setStatus] = useState('Ready');
  const [chatMessages, setChatMessages] = useState([]);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const fileInputRef = useRef();

  const activeFile = files[activeFileIdx];

  // Load code from localStorage or default
  useEffect(() => {
    setFiles(prev => prev.map((f, i) => {
      const saved = localStorage.getItem(`code_${f.name}`);
      return { ...f, code: saved || DEFAULT_CODE[f.language] };
    }));
  }, []);

  // Save code to localStorage
  useEffect(() => {
    files.forEach(f => localStorage.setItem(`code_${f.name}`, f.code));
  }, [files]);

  // Command palette shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Handlers
  const handleRun = async () => {
    setStatus('Running...');
    setOutput('Running code...');
    try {
      const response = await fetch('http://localhost:3001/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: activeFile.language, code: activeFile.code, input }),
      });
      const result = await response.json();
      let out = '';
      if (result.stdout) out += result.stdout;
      if (result.stderr) out += `\n[stderr]\n${result.stderr}`;
      setOutput(out);
      setStatus('Done');
    } catch (error) {
      setOutput('Error: ' + error.message);
      setStatus('Error');
    }
  };

  const handleClearOutput = () => setOutput('');

  const handleAskTutor = async () => {
    setAiTutorResponse('Thinking...');
    try {
      const response = await fetch('http://localhost:3001/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Explain this ${activeFile.language} code, show variable values step-by-step, and suggest improvements.\n\n${activeFile.code}`,
        }),
      });
      const result = await response.json();
      setAiTutorResponse(result.response);
    } catch (error) {
      setAiTutorResponse('Error: ' + error.message);
    }
  };

  const handleAskWrite = async (prompt) => {
    setAiWriteResponse('Thinking...');
    try {
      const response = await fetch('http://localhost:3001/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();
      setAiWriteResponse(result.response);
    } catch (error) {
      setAiWriteResponse('Error: ' + error.message);
    }
  };

  // Only insert code block from AI Write
  const handleInsertCode = () => {
    if (aiWriteResponse) {
      const match = aiWriteResponse.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      const codeOnly = match && match[1] ? match[1].trim() : aiWriteResponse.trim();
      setFiles(files => files.map((f, i) => i === activeFileIdx ? { ...f, code: codeOnly } : f));
    }
  };

  // File tab switching
  const handleTabClick = idx => setActiveFileIdx(idx);

  // File upload
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const lang = ext === 'py' ? 'python' : ext === 'js' ? 'javascript' : ext === 'cpp' ? 'cpp' : ext === 'java' ? 'java' : 'plaintext';
    const reader = new FileReader();
    reader.onload = evt => {
      setFiles([...files, { name: file.name, language: lang, code: evt.target.result }]);
      setActiveFileIdx(files.length);
    };
    reader.readAsText(file);
  };

  // File download
  const handleDownload = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Output copy
  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setStatus('Output copied!');
    setTimeout(() => setStatus('Ready'), 1000);
  };

  // Command palette
  const handleCommand = (cmd) => {
    if (cmd === 'run') handleRun();
    if (cmd === 'clear') handleClearOutput();
    if (cmd === 'theme') setTheme(theme === 'dark' ? 'light' : 'dark');
    setCommandPaletteOpen(false);
  };

  // Editor change
  const handleEditorChange = code => {
    setFiles(files => files.map((f, i) => i === activeFileIdx ? { ...f, code } : f));
  };

  // Sidebar toggle
  const toggleSidebar = () => setSidebarOpen(open => !open);

  // New file creation handler
  const handleCreateFile = (name) => {
    // Detect language from extension
    let ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    let language = 'python';
    if (ext === 'js') language = 'javascript';
    else if (ext === 'cpp') language = 'cpp';
    else if (ext === 'java') language = 'java';
    // Ensure unique name
    let uniqueName = name;
    let idx = 1;
    while (files.some(f => f.name === uniqueName)) {
      uniqueName = name.replace(/(\.[^.]+)?$/, `_${idx}${ext ? '.' + ext : ''}`);
      idx++;
    }
    setFiles([...files, { name: uniqueName, language, code: DEFAULT_CODE[language] || '' }]);
    setActiveFileIdx(files.length);
    setNewFileModalOpen(false);
  };

  return (
    <MantineProvider theme={{ colorScheme: theme }} withGlobalStyles withNormalizeCSS>
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#181A1B' : '#f8f9fa', overflow: 'hidden' }}>
        <HeaderBar
          language={activeFile.language}
          setLanguage={lang => setFiles(files => files.map((f, i) => i === activeFileIdx ? { ...f, language: lang } : f))}
          fontSize={fontSize}
          setFontSize={value => setFontSize(value)}
          theme={theme}
          toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onRun={handleRun}
          onClear={handleClearOutput}
        />
        <FileTabs
          files={files}
          activeFileIdx={activeFileIdx}
          onTabClick={handleTabClick}
          theme={theme}
          onTabReorder={(from, to) => {
            const reordered = Array.from(files);
            const [moved] = reordered.splice(from, 1);
            reordered.splice(to, 0, moved);
            setFiles(reordered);
            setActiveFileIdx(to);
          }}
          onRename={(idx, newName) => {
            setFiles(files => files.map((f, i) => i === idx ? { ...f, name: newName } : f));
          }}
          onDelete={idx => {
            if (files.length === 1) return;
            const newFiles = files.filter((_, i) => i !== idx);
            setFiles(newFiles);
            setActiveFileIdx(idx === 0 ? 0 : idx - 1);
          }}
          onUpload={handleFileUpload}
          onDownload={idx => {
            const file = files[idx];
            const blob = new Blob([file.code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onAddTab={() => setNewFileModalOpen(true)}
        />
        <NewFileModal
          opened={newFileModalOpen}
          onClose={() => setNewFileModalOpen(false)}
          onCreate={handleCreateFile}
        />
        <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
          <div style={{ flex: sidebarOpen ? 1 : 1.2, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <div style={{ flex: 7, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
              <EditorPane
                language={activeFile.language}
                fontSize={fontSize}
                theme={theme}
                code={activeFile.code}
                onChange={handleEditorChange}
              />
            </div>
            <div style={{ flex: 3, minHeight: 0, display: 'flex', flexDirection: 'row', alignItems: 'stretch', background: theme === 'dark' ? '#181A1B' : '#f8f9fa', borderTop: `1px solid ${theme === 'dark' ? '#23272e' : '#dee2e6'}`, width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <label style={{ color: theme === 'dark' ? '#aaa' : '#333', marginBottom: 4 }}>Input (stdin):</label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={3}
                  placeholder="Enter input for your program..."
                  style={{
                    marginBottom: 8,
                    fontSize: Number(fontSize),
                    background: theme === 'dark' ? '#23272e' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#222',
                    border: `1px solid ${theme === 'dark' ? '#373a40' : '#ccc'}`,
                    borderRadius: 6,
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: 10,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
                <Group>
                  <Button style={{margin:5}} onClick={handleRun} color="blue">Run</Button>
                  <Button style={{margin:5}} onClick={handleClearOutput} color="gray">Clear Output</Button>
                </Group>
              </div>
              <div style={{ flex: 2, padding: 16, borderLeft: `1px solid ${theme === 'dark' ? '#23272e' : '#dee2e6'}`, background: theme === 'dark' ? '#1e1e1e' : '#fff', color: theme === 'dark' ? '#fff' : '#222', overflowY: 'auto', fontFamily: 'Fira Mono, Consolas, Monaco, monospace', fontSize: Number(fontSize), minWidth: 0, position: 'relative' }}>
                <label style={{ color: theme === 'dark' ? '#aaa' : '#333', marginBottom: 4 }}>Output:</label>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
                <Tooltip label="Copy Output"><ActionIcon color="gray" variant="light" onClick={handleCopyOutput} style={{ position: 'absolute', top: 8, right: 8 }}><IconCopy size={16} /></ActionIcon></Tooltip>
              </div>
            </div>
            {/* Status Bar */}
            <div style={{ height: 28, background: theme === 'dark' ? '#23272e' : '#e9ecef', color: theme === 'dark' ? '#fff' : '#222', display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 13, borderTop: `1px solid ${theme === 'dark' ? '#373a40' : '#dee2e6'}` }}>
              <span>Status: {status}</span>
              <span style={{ marginLeft: 24 }}>File: {activeFile.name}</span>
              <span style={{ marginLeft: 24 }}>Language: {activeFile.language}</span>
            </div>
          </div>
          {/* Collapsible Sidebar */}
          <div style={{ width: sidebarOpen ? 360 : 24, transition: 'width 0.2s', background: theme === 'dark' ? '#23272e' : '#f8f9fa', borderLeft: `1px solid ${theme === 'dark' ? '#373a40' : '#dee2e6'}`, height: '100%', position: 'relative', display: 'flex', flexDirection: 'row' }}>
            {sidebarOpen && <AISidebar
              aiTutorResponse={aiTutorResponse}
              aiWriteResponse={aiWriteResponse}
              onAskTutor={handleAskTutor}
              onAskWrite={handleAskWrite}
              onInsertCode={handleInsertCode}
              theme={theme}
              chatMessages={chatMessages}
              onChat={msg => {
                if (!msg.trim()) return;
                setChatMessages(msgs => [...msgs, { role: 'user', text: msg }]);
                fetch('http://localhost:3001/tutor', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: msg }),
                })
                  .then(res => res.json())
                  .then(data => setChatMessages(msgs => [...msgs, { role: 'ai', text: data.response }]))
                  .catch(e => setChatMessages(msgs => [...msgs, { role: 'ai', text: 'Error: ' + e.message }]));
              }}
            />}
            <ActionIcon onClick={toggleSidebar} style={{ position: 'absolute', top: 8, left: sidebarOpen ? -20 : 2, zIndex: 10, background: theme === 'dark' ? '#23272e' : '#e9ecef', border: `1px solid ${theme === 'dark' ? '#373a40' : '#dee2e6'}` }}>
              {sidebarOpen ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
            </ActionIcon>
          </div>
      </div>
        <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onCommand={handleCommand} theme={theme} />
      </div>
    </MantineProvider>
  );
}
