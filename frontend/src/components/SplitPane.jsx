import { useRef, useState } from 'react';

export default function SplitPane({ left, right, min = 200, max = 800 }) {
  const [width, setWidth] = useState(window.innerWidth / 2);
  const dragging = useRef(false);

  const onMouseDown = () => { dragging.current = true; };
  const onMouseUp = () => { dragging.current = false; };
  const onMouseMove = e => {
    if (dragging.current) {
      setWidth(Math.max(min, Math.min(max, e.clientX)));
    }
  };

  // Attach/detach listeners
  window.onmousemove = onMouseMove;
  window.onmouseup = onMouseUp;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ width, minWidth: min, maxWidth: max, height: '100%' }}>{left}</div>
      <div
        style={{
          width: 6, cursor: 'col-resize', background: '#ccc', zIndex: 10,
        }}
        onMouseDown={onMouseDown}
      />
      <div style={{ flex: 1, height: '100%' }}>{right}</div>
    </div>
  );
} 