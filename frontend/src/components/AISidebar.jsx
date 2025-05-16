import { useState, useRef, useEffect } from 'react';
import { Tabs, Button, Textarea, TextInput, Group } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

export default function AISidebar({ aiTutorResponse, aiWriteResponse, onAskTutor, onAskWrite, theme, onInsertCode, onChat, chatMessages }) {
  const [aiWritePrompt, setAiWritePrompt] = useState('');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  const sidebarBg = theme === 'dark' ? '#23272e' : '#f8f9fa';
  const borderCol = theme === 'dark' ? '#373a40' : '#dee2e6';
  const textCol = theme === 'dark' ? '#fff' : '#222';
  const userBubble = theme === 'dark' ? '#1971c2' : '#e7f5ff';
  const aiBubble = theme === 'dark' ? '#343a40' : '#f1f3f5';
  const aiText = theme === 'dark' ? '#fff' : '#222';
  const userText = theme === 'dark' ? '#fff' : '#1971c2';

  const buttonStyle = {
    border: '1px solid #000',
    fontWeight: 600,
    fontSize: 16,
    padding: '10px 24px',
    margin: '5px',
  };

  const inputStyle = {
    background: theme === 'dark' ? '#23272e' : '#fff',
    color: theme === 'dark' ? '#fff' : '#222',
    border: `1px solid ${borderCol}`,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 12,
    width: '100%',
    boxSizing: 'border-box',
    padding: 8,
    resize: 'vertical',
  };

  const labelStyle = {
    color: theme === 'dark' ? '#fff' : '#222',
    fontWeight: 500,
    marginBottom: 4,
    fontSize: 15,
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div
      style={{
        width: 360,
        background: sidebarBg,
        borderLeft: `1px solid ${borderCol}`,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Tabs
        defaultValue="tutor"
        color="blue"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
        variant="outline"
        radius="md"
        keepMounted={false}
      >
        <Tabs.List style={{ padding: '0 24px', borderBottom: `1px solid ${borderCol}`, background: sidebarBg, position: 'sticky', top: 0, zIndex: 2 }}>
          <Tabs.Tab value="tutor" style={{ fontWeight: 600, fontSize: 16, padding: '10px 24px', margin: '5px' }}>AI Tutor</Tabs.Tab>
          <Tabs.Tab value="write" style={{ fontWeight: 600, fontSize: 16, padding: '10px 24px', margin: '5px' }}>AI Write</Tabs.Tab>
          <Tabs.Tab value="chat" style={{ fontWeight: 600, fontSize: 16, padding: '10px 24px', margin: '5px' }}>AI Chat</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="tutor" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, minHeight: 0 }}>
          <Button onClick={onAskTutor} color="blue" mb={16} style={{ ...buttonStyle, alignSelf: 'flex-start' }}>Ask AI Tutor</Button>
          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: textCol, flex: 1, overflowY: 'auto', fontSize: 15 }}>{aiTutorResponse}</div>
        </Tabs.Panel>
        <Tabs.Panel value="write" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, minHeight: 0 }}>
          <label style={labelStyle}>Describe what you want to code</label>
          <textarea
            value={aiWritePrompt}
            onChange={e => setAiWritePrompt(e.target.value)}
            rows={3}
            placeholder="e.g. 'A Python function to reverse a string'"
            style={inputStyle}
          />
          <Group mb={8} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12, marginTop: 8 }}>
            <Button style={{ ...buttonStyle, color: '#fff', background: '#228be6', border: '1px solid #000' }} onClick={() => onAskWrite(aiWritePrompt)}>
              Write with AI
            </Button>
            <Button style={{ ...buttonStyle, color: '#fff', background: '#228be6', border: '1px solid #000' }} onClick={onInsertCode} variant="outline">
              Insert to Editor
            </Button>
          </Group>
          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: textCol, flex: 1, overflowY: 'auto', fontSize: 15 }}>{aiWriteResponse}</div>
        </Tabs.Panel>
        <Tabs.Panel value="chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, minHeight: 0, height: '100%' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: sidebarBg, borderRadius: 0, borderBottom: `1px solid ${borderCol}` }}>
            <div
              ref={chatScrollRef}
              style={{
                flex: 1,
                minHeight: 0,
                maxHeight: 'calc(100vh - 180px)',
                padding: 24,
                paddingBottom: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      background: msg.role === 'user' ? userBubble : aiBubble,
                      color: msg.role === 'user' ? userText : aiText,
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '10px 16px',
                      fontSize: 15,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      wordBreak: 'break-word',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.role === 'user' ? (
                      msg.text
                    ) : (
                      <ReactMarkdown
                        components={{
                          code: ({ node, inline, className, children, ...props }) =>
                            inline ? (
                              <code style={{ background: theme === 'dark' ? '#222' : '#eee', borderRadius: 4, padding: '2px 4px', fontSize: 14 }}>{children}</code>
                            ) : (
                              <pre style={{ background: theme === 'dark' ? '#222' : '#eee', borderRadius: 6, padding: 12, fontSize: 14, overflowX: 'auto' }}><code>{children}</code></pre>
                            ),
                          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ color: theme === 'dark' ? '#ffd43b' : '#b197fc' }}>{children}</strong>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ height: 1 }} />
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (chatInput.trim()) {
                onChat(chatInput);
                setChatInput('');
              }
            }}
            style={{ padding: 16, borderTop: `1px solid ${borderCol}`, background: sidebarBg, display: 'flex', alignItems: 'center' }}
          >
            <TextInput
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask the AI anything..."
              style={{ flex: 1, marginRight: 12 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    onChat(chatInput);
                    setChatInput('');
                  }
                }
              }}
            />
            <Button type="submit" color="blue" style={buttonStyle}>Send</Button>
          </form>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
} 