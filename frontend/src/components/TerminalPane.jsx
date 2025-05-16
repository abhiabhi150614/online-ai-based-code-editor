import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalPane = forwardRef(({ theme, fontSize }, ref) => {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || xtermRef.current) return;
    const xterm = new Terminal({
      fontSize: parseInt(fontSize),
      theme: theme === 'dark'
        ? { background: '#1e1e1e', foreground: '#fff' }
        : { background: '#fff', foreground: '#000' },
      cursorBlink: true,
    });
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(containerRef.current);
    fitAddon.fit();
    xterm.writeln('Welcome to the IDE Terminal!');
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;
  }, []);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = parseInt(fontSize);
      xtermRef.current.options.theme =
        theme === 'dark'
          ? { background: '#1e1e1e', foreground: '#fff' }
          : { background: '#fff', foreground: '#000' };
      fitAddonRef.current && fitAddonRef.current.fit();
    }
  }, [theme, fontSize]);

  useImperativeHandle(ref, () => ({
    write: (text) => xtermRef.current && xtermRef.current.write(text),
    clear: () => xtermRef.current && xtermRef.current.clear(),
    writeln: (text) => xtermRef.current && xtermRef.current.writeln(text),
  }), []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: theme === 'dark' ? '#1e1e1e' : '#fff' }} />;
});

export default TerminalPane; 