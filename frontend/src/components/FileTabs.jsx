import { useState } from 'react';
import { ActionIcon, Tooltip, Menu, TextInput } from '@mantine/core';
import { IconUpload, IconDownload, IconX, IconEdit, IconPlus } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function FileTabs({ files, activeFileIdx, onTabClick, onTabReorder, onRename, onDelete, onUpload, onDownload, theme, onAddTab }) {
  const [renamingIdx, setRenamingIdx] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = (idx) => {
    setRenamingIdx(idx);
    setRenameValue(files[idx].name);
  };

  const handleRenameSubmit = (idx) => {
    onRename(idx, renameValue);
    setRenamingIdx(null);
    setRenameValue('');
  };

  const isDark = theme === 'dark';
  const colors = {
    barBg: isDark ? '#23272e' : '#f4f4f4',
    tabActiveBg: isDark ? '#181A1B' : '#fff',
    tabInactiveBg: isDark ? 'transparent' : 'transparent',
    tabActiveText: isDark ? '#fff' : '#222',
    tabInactiveText: isDark ? '#adb5bd' : '#495057',
    tabHoverBg: isDark ? '#25262b' : '#ececec',
    tabActiveBorder: isDark ? '#4dabf7' : '#228be6',
    tabInactiveBorder: 'transparent',
    buttonBg: isDark ? '#23272e' : '#f4f4f4',
    buttonHover: isDark ? '#25262b' : '#e9ecef',
    closeHover: isDark ? '#fa5252' : '#e03131',
    scrollbar: isDark ? '#373a40' : '#dee2e6',
  };

  // Styles
  const barStyle = {
    display: 'flex',
    alignItems: 'center',
    background: colors.barBg,
    borderBottom: `1px solid ${isDark ? '#23272e' : '#dee2e6'}`,
    height: 40,
    padding: '0 8px',
    gap: 0,
    zIndex: 10,
  };
  const tabsScrollStyle = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    overflowX: 'auto',
    minWidth: 0,
    scrollbarColor: `${colors.scrollbar} transparent`,
    scrollbarWidth: 'thin',
  };
  const tabStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0 18px 0 14px',
    height: 36,
    marginRight: 2,
    borderRadius: '0',
    background: active ? colors.tabActiveBg : colors.tabInactiveBg,
    color: active ? colors.tabActiveText : colors.tabInactiveText,
    fontWeight: active ? 600 : 400,
    fontSize: 14,
    border: 'none',
    borderBottom: `2.5px solid ${active ? colors.tabActiveBorder : colors.tabInactiveBorder}`,
    cursor: 'pointer',
    minWidth: 80,
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s, color 0.15s',
    position: 'relative',
    zIndex: active ? 2 : 1,
  });
  const closeBtnStyle = {
    marginLeft: 8,
    opacity: 0,
    borderRadius: 3,
    transition: 'background 0.15s, color 0.15s, opacity 0.15s',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const closeBtnVisible = {
    opacity: 1,
    background: 'transparent',
  };
  const buttonsBarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginLeft: 20,
    flexShrink: 0,
  };
  const actionBtnStyle = {
    width: 32,
    height: 32,
    background: colors.buttonBg,
    color: colors.tabInactiveText,
    border: 'none',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    boxShadow: 'none',
    cursor: 'pointer',
    marginRight: 0,
  };
  const addTabBtnStyle = {
    ...actionBtnStyle,
    marginLeft: 12,
    fontWeight: 700,
    color: colors.tabInactiveText,
    border: 'none',
    background: 'transparent',
    fontSize: 18,
    width: 32,
    height: 32,
    borderRadius: 6,
    padding: 0,
  };

  return (
    <div style={barStyle}>
      <div
        style={tabsScrollStyle}
        className="filetabs-scrollbar"
      >
        <DragDropContext onDragEnd={result => {
          if (!result.destination) return;
          onTabReorder(result.source.index, result.destination.index);
        }}>
          <Droppable droppableId="tabs" direction="horizontal" isDropDisabled={false} isCombineEnabled={false}>
            {provided => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps} 
                style={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}
              >
                {files.map((f, idx) => (
                  <Draggable key={f.name} draggableId={f.name} index={idx} isDragDisabled={false}>
                    {dragProvided => (
                      <Menu withinPortal position="bottom-start" shadow="md">
                        <Menu.Target>
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            onClick={() => onTabClick(idx)}
                            style={tabStyle(idx === activeFileIdx)}
                            onDoubleClick={() => handleRename(idx)}
                            onMouseOver={e => {
                              e.currentTarget.style.background = idx === activeFileIdx ? colors.tabActiveBg : colors.tabHoverBg;
                              const close = e.currentTarget.querySelector('.tab-close-btn');
                              if (close) close.style.opacity = 1;
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = idx === activeFileIdx ? colors.tabActiveBg : colors.tabInactiveBg;
                              const close = e.currentTarget.querySelector('.tab-close-btn');
                              if (close) close.style.opacity = 0;
                            }}
                          >
                            {renamingIdx === idx ? (
                              <TextInput
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onBlur={() => handleRenameSubmit(idx)}
                                onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(idx); }}
                                size="xs"
                                autoFocus
                                style={{ width: 90, fontSize: 13 }}
                              />
                            ) : (
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                            )}
                            {files.length > 1 && renamingIdx !== idx && (
                              <span
                                className="tab-close-btn"
                                style={closeBtnStyle}
                                onClick={e => { e.stopPropagation(); onDelete(idx); }}
                                onMouseOver={e => { e.currentTarget.style.background = colors.closeHover; e.currentTarget.style.color = '#fff'; e.currentTarget.style.opacity = 1; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.tabInactiveText; e.currentTarget.style.opacity = 1; }}
                              >
                                <IconX size={14} />
                              </span>
                            )}
                          </div>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item icon={<IconEdit size={14} />} onClick={() => handleRename(idx)}>Rename</Menu.Item>
                          <Menu.Item icon={<IconX size={14} />} color="red" onClick={() => onDelete(idx)}>Delete</Menu.Item>
                          <Menu.Item icon={<IconDownload size={14} />} onClick={() => onDownload(idx)}>Download</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div style={buttonsBarStyle}>
        <Tooltip label="Upload File" position="bottom" withArrow>
          <ActionIcon 
            color="gray" 
            variant="subtle" 
            component="label"
            size="md"
            style={actionBtnStyle}
            onMouseOver={e => { e.currentTarget.style.background = colors.buttonHover; }}
            onMouseOut={e => { e.currentTarget.style.background = colors.buttonBg; }}
          >
            <IconUpload size={16} />
            <input type="file" hidden onChange={onUpload} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Download Current File" position="bottom" withArrow>
          <ActionIcon 
            color="gray" 
            variant="subtle"
            size="md"
            style={actionBtnStyle}
            onClick={() => onDownload(activeFileIdx)}
            onMouseOver={e => { e.currentTarget.style.background = colors.buttonHover; }}
            onMouseOut={e => { e.currentTarget.style.background = colors.buttonBg; }}
          >
            <IconDownload size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="New File" position="bottom" withArrow>
          <ActionIcon
            style={addTabBtnStyle}
            onClick={onAddTab}
            onMouseOver={e => { e.currentTarget.style.background = colors.buttonHover; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
      <style>{`
        .filetabs-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .filetabs-scrollbar::-webkit-scrollbar-thumb {
          background: ${colors.scrollbar};
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 