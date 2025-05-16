import { Modal, List } from '@mantine/core';
export default function ShortcutsModal({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <List>
        <List.Item>Run code: <b>Ctrl+Enter</b></List.Item>
        <List.Item>Command palette: <b>Ctrl+P</b></List.Item>
        <List.Item>Find: <b>Ctrl+F</b></List.Item>
        <List.Item>Format code: <b>Ctrl+Shift+F</b></List.Item>
        <List.Item>Switch theme: <b>Ctrl+K T</b></List.Item>
        <List.Item>Split editor: <b>Ctrl+\</b></List.Item>
        <List.Item>Close tab: <b>Ctrl+W</b></List.Item>
      </List>
    </Modal>
  );
} 