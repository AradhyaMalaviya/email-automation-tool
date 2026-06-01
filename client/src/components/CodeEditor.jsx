import React, { useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

export default function CodeEditor({ value, onChange }) {
  const editor = useRef(null);
  const view = useRef(null);

  useEffect(() => {
    if (!editor.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        html(),
        oneDark,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    view.current = new EditorView({
      state: startState,
      parent: editor.current,
    });

    return () => {
      if (view.current) {
        view.current.destroy();
      }
    };
  }, []); // Initialize once

  useEffect(() => {
    if (view.current && value !== view.current.state.doc.toString()) {
      view.current.dispatch({
        changes: { from: 0, to: view.current.state.doc.length, insert: value }
      });
    }
  }, [value]);

  return <div ref={editor} className="codemirror-wrapper" />;
}
