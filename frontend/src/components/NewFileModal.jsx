import { useState } from 'react';
import { Modal, TextInput, Button, Group } from '@mantine/core';

export default function NewFileModal({ opened, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('File name is required');
      return;
    }
    setError('');
    onCreate(name.trim());
    setName('');
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New File" centered>
      <TextInput
        label="File Name"
        placeholder="e.g. myfile.cpp"
        value={name}
        onChange={e => setName(e.target.value)}
        error={error}
        mb={16}
        autoFocus
      />
      <Group position="right">
        <Button onClick={onClose} variant="default">Cancel</Button>
        <Button onClick={handleCreate} color="blue">Create</Button>
      </Group>
    </Modal>
  );
} 