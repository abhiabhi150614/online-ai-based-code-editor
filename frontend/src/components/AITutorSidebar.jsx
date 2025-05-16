import { Button } from '@mantine/core';

export default function AITutorSidebar({ aiResponse, onAskAI, theme }) {
  return (
    <div style={{ width: 340, background: theme === 'dark' ? '#23272e' : '#f8f9fa', borderLeft: `1px solid ${theme === 'dark' ? '#373a40' : '#dee2e6'}`, padding: 24, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: 0, marginBottom: 12, color: theme === 'dark' ? '#fff' : '#222' }}>AI Tutor</h3>
      <Button onClick={onAskAI} color="blue" mb={8}>Ask AI</Button>
      <div style={{ marginTop: 16, whiteSpace: 'pre-wrap', color: theme === 'dark' ? '#eee' : '#222', flex: 1, overflowY: 'auto', fontSize: 14 }}>{aiResponse}</div>
    </div>
  );
} 