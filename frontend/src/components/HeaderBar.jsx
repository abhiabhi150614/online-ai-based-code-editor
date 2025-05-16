import { Group, Select, ActionIcon, Text } from '@mantine/core';
import { IconSun, IconMoonStars, IconPlayerPlay, IconTrash, IconLanguage } from '@tabler/icons-react';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const FONT_SIZES = [
  { value: '12', label: '12px' },
  { value: '14', label: '14px' },
  { value: '16', label: '16px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
  { value: '24', label: '24px' },
];

export default function HeaderBar({ language, setLanguage, fontSize, setFontSize, theme, toggleTheme, onRun, onClear }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme === 'dark' ? '#181A1B' : '#f8f9fa', padding: '0 1.5rem', height: 56, borderBottom: `1px solid ${theme === 'dark' ? '#23272e' : '#dee2e6'}` }}>
      <Group>
        <IconLanguage size={20} style={{ marginRight: 4 }} />
        <Text size="sm" style={{ marginRight: 4 }}>Language:</Text>
        <Select value={language} onChange={setLanguage} data={LANGUAGES} size="sm" style={{ width: 140 }} />
        <Text size="sm" style={{ marginLeft: 16, marginRight: 4 }}>Font Size:</Text>
        <Select value={fontSize} onChange={setFontSize} data={FONT_SIZES} size="sm" style={{ width: 90 }} />
        <ActionIcon color="blue" variant="filled" onClick={onRun} size="lg" title="Run"><IconPlayerPlay size={20} /></ActionIcon>
        <ActionIcon color="gray" variant="light" onClick={onClear} size="lg" title="Clear Output"><IconTrash size={20} /></ActionIcon>
      </Group>
      <Group>
        <ActionIcon variant="default" onClick={toggleTheme} size="lg" title="Toggle Theme">
          {theme === 'dark' ? <IconSun size={20} /> : <IconMoonStars size={20} />}
        </ActionIcon>
      </Group>
    </div>
  );
} 