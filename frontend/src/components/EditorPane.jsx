import Editor from '@monaco-editor/react';
import { useRef, useEffect, useState } from 'react';

export default function EditorPane({ language, fontSize, theme, code, onChange, showMinimap, formatCode }) {
  const editorRef = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (formatCode && editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  }, [formatCode]);

  // Helper: detect AI comment pattern
  function getAIPrompt(line, lang) {
    if (lang === 'python') {
      // Support #ai, # ai, # ai:, etc.
      const m = line.match(/^\s*#\s*ai\s*:?\s+(.+)/i);
      return m ? m[1] : null;
    } else {
      // Support //ai, // ai, // ai:, etc.
      const m = line.match(/^\s*\/\/\s*ai\s*:?\s+(.+)/i);
      return m ? m[1] : null;
    }
  }

  // Handle Enter key for AI trigger
  function handleEditorWillMount(monaco) {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: () => ({ suggestions: [] }),
    });
  }

  async function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    editor.onKeyDown(async (e) => {
      if (e.keyCode === 3) return; // ignore Ctrl+C
      if (e.keyCode === 13) { // Enter
        const pos = editor.getPosition();
        const model = editor.getModel();
        if (!model) return;
        const lineNum = pos.lineNumber;
        const line = model.getLineContent(lineNum - 1);
        const prompt = getAIPrompt(line, language);
        if (prompt && !aiLoading) {
          setAiLoading(true);
          // Insert loading placeholder
          editor.executeEdits(null, [{
            range: new monaco.Range(lineNum + 1, 1, lineNum + 1, 1),
            text: '# AI is thinking...\n',
            forceMoveMarkers: true,
          }]);
          try {
            const res = await fetch('http://localhost:3001/tutor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            // Remove loading placeholder
            const afterLine = model.getLineContent(lineNum + 1);
            if (afterLine.trim() === '# AI is thinking...') {
              editor.executeEdits(null, [{
                range: new monaco.Range(lineNum + 1, 1, lineNum + 2, 1),
                text: '',
                forceMoveMarkers: true,
              }]);
            }
            // Insert AI code
            let aiCode = data.response || '';
            // Remove markdown code block if present
            const match = aiCode.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
            if (match && match[1]) aiCode = match[1];
            editor.executeEdits(null, [{
              range: new monaco.Range(lineNum + 1, 1, lineNum + 1, 1),
              text: aiCode + '\n',
              forceMoveMarkers: true,
            }]);
            // Update parent
            onChange(editor.getValue());
          } catch (err) {
            editor.executeEdits(null, [{
              range: new monaco.Range(lineNum + 1, 1, lineNum + 1, 1),
              text: '# AI error: ' + err.message + '\n',
              forceMoveMarkers: true,
            }]);
          } finally {
            setAiLoading(false);
          }
        }
      }
    });
  }

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : theme}
      value={code}
      onChange={v => onChange(v || '')}
      onMount={handleEditorMount}
      beforeMount={handleEditorWillMount}
      options={{
        fontSize: parseInt(fontSize),
        minimap: { enabled: showMinimap },
        fontFamily: 'Fira Mono, Consolas, Monaco, monospace',
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        wordBasedSuggestions: true,
        tabCompletion: 'on',
        formatOnType: true,
        formatOnPaste: true,
        bracketPairColorization: { enabled: true },
        autoIndent: 'full',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        cursorSmoothCaretAnimation: true,
      }}
    />
  );
} 