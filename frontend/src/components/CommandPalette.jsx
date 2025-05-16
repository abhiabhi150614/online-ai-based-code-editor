import { Modal, Button, TextInput } from '@mantine/core';
import { useState } from 'react';

const COMMANDS = [
  { label: 'Run Code', value: 'run' },
  { label: 'Clear Terminal', value: 'clear' },
  { label: 'Toggle Theme', value: 'theme' },
];

export default function CommandPalette({ open, onClose, onCommand, theme }) {
  const [search, setSearch] = useState('');
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal opened={open} onClose={onClose} title="Command Palette (Ctrl+P)" centered size="sm">
      <TextInput
        placeholder="Type a command..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const cmd = filtered[0];
            if (cmd) onCommand(cmd.value);
          }
        }}
      />
      <div style={{ marginTop: 12 }}>
        {filtered.map(cmd => (
          <Button key={cmd.value} fullWidth variant="subtle" onClick={() => onCommand(cmd.value)} style={{ marginBottom: 4 }}>{cmd.label}</Button>
        ))}
      </div>
    </Modal>
  );
} 