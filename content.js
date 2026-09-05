// LinkedIn Post Formatter — a Medium/Notion-style floating panel that
// appears synchronously when you select text (mouseup / shift+arrow),
// so there is no async gap for LinkedIn's Quill-based editor to clear
// the selection before we act on it.
(function () {
  'use strict';

  if (window.__linkedInFormatterInstalled) return;
  window.__linkedInFormatterInstalled = true;

  const UNDERLINE_MARK = String.fromCharCode(0x0332);
  const STRIKE_MARK = String.fromCharCode(0x0335);

  // ---------------------------------------------------------------------
  // Unicode text transforms
  // ---------------------------------------------------------------------
  const UnicodeFormatter = {
    unicodeToNormal(char) {
      const code = char.codePointAt(0);
      if (code >= 0x1D400 && code <= 0x1D7FF) {
        if (code >= 0x1D63C && code <= 0x1D655) return String.fromCharCode(65 + (code - 0x1D63C)); // bold italic upper
        if (code >= 0x1D656 && code <= 0x1D66F) return String.fromCharCode(97 + (code - 0x1D656)); // bold italic lower
        if (code >= 0x1D5D4 && code <= 0x1D5ED) return String.fromCharCode(65 + (code - 0x1D5D4)); // bold upper
        if (code >= 0x1D5EE && code <= 0x1D607) return String.fromCharCode(97 + (code - 0x1D5EE)); // bold lower
        if (code >= 0x1D608 && code <= 0x1D621) return String.fromCharCode(65 + (code - 0x1D608)); // italic upper
        if (code >= 0x1D622 && code <= 0x1D63B) return String.fromCharCode(97 + (code - 0x1D622)); // italic lower
        if (code >= 0x1D670 && code <= 0x1D689) return String.fromCharCode(65 + (code - 0x1D670)); // mono upper
        if (code >= 0x1D68A && code <= 0x1D6A3) return String.fromCharCode(97 + (code - 0x1D68A)); // mono lower
        if (code >= 0x1D7EC && code <= 0x1D7F5) return String.fromCharCode(48 + (code - 0x1D7EC)); // bold digits
        if (code >= 0x1D7F6 && code <= 0x1D7FF) return String.fromCharCode(48 + (code - 0x1D7F6)); // mono digits
      }
      return char;
    },

    stripCombining(char) {
      return char === UNDERLINE_MARK || char === STRIKE_MARK ? '' : char;
    },

    normalize(text) {
      return Array.from(text)
        .map((char) => this.stripCombining(this.unicodeToNormal(char)))
        .join('');
    },

    isFormatted(text, style) {
      if (!text) return false;
      const code = text.codePointAt(0);
      switch (style) {
        case 'bold':
          return (
            (code >= 0x1D5D4 && code <= 0x1D5ED) ||
            (code >= 0x1D5EE && code <= 0x1D607) ||
            (code >= 0x1D63C && code <= 0x1D66F) ||
            (code >= 0x1D7EC && code <= 0x1D7F5)
          );
        case 'italic':
          return (
            (code >= 0x1D608 && code <= 0x1D621) ||
            (code >= 0x1D622 && code <= 0x1D63B) ||
            (code >= 0x1D63C && code <= 0x1D66F)
          );
        case 'underline':
          return text.includes(UNDERLINE_MARK);
        case 'strikethrough':
          return text.includes(STRIKE_MARK);
        case 'monospace':
          return (
            (code >= 0x1D670 && code <= 0x1D689) ||
            (code >= 0x1D68A && code <= 0x1D6A3) ||
            (code >= 0x1D7F6 && code <= 0x1D7FF)
          );
        default:
          return false;
      }
    },

    toggleMap(text, style, map) {
      const already = this.isFormatted(text, style);
      const normalized = this.normalize(text);
      if (already) return normalized;
      return Array.from(normalized)
        .map((char) => map(char) || char)
        .join('');
    },

    toBold(text) {
      return this.toggleMap(text, 'bold', (char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D5D4 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D5EE + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7EC + (code - 48));
        return null;
      });
    },

    toItalic(text) {
      return this.toggleMap(text, 'italic', (char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D608 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D622 + (code - 97));
        return null;
      });
    },

    toMonospace(text) {
      return this.toggleMap(text, 'monospace', (char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D670 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D68A + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7F6 + (code - 48));
        return null;
      });
    },

    toUnderline(text) {
      const already = this.isFormatted(text, 'underline');
      const normalized = this.normalize(text);
      if (already) return normalized;
      return Array.from(normalized).map((char) => char + UNDERLINE_MARK).join('');
    },

    toStrikethrough(text) {
      const already = this.isFormatted(text, 'strikethrough');
      const normalized = this.normalize(text);
      if (already) return normalized;
      return Array.from(normalized).map((char) => char + STRIKE_MARK).join('');
    },

    toBulletList(text) {
      return text
        .split('\n')
        .map((line) => (line.trim() ? '• ' + line.trim() : line))
        .join('\n');
    },

    toNumberedList(text) {
      let n = 0;
      return text
        .split('\n')
        .map((line) => {
          if (!line.trim()) return line;
          n += 1;
          return `${n}. ${line.trim()}`;
        })
        .join('\n');
    },

    toHashtag(text) {
      return text
        .trim()
        .split(/\s+/)
        .map((word) => (word.startsWith('#') ? word : '#' + word))
        .join(' ');
    },

    toMention(text) {
      const trimmed = text.trim();
      return trimmed.startsWith('@') ? trimmed : '@' + trimmed;
    },
  };

  const ACTIONS = {
    bold: (t) => UnicodeFormatter.toBold(t),
    italic: (t) => UnicodeFormatter.toItalic(t),
    underline: (t) => UnicodeFormatter.toUnderline(t),
    strikethrough: (t) => UnicodeFormatter.toStrikethrough(t),
    monospace: (t) => UnicodeFormatter.toMonospace(t),
    bullet: (t) => UnicodeFormatter.toBulletList(t),
    number: (t) => UnicodeFormatter.toNumberedList(t),
    hashtag: (t) => UnicodeFormatter.toHashtag(t),
    mention: (t) => UnicodeFormatter.toMention(t),
  };

  // ---------------------------------------------------------------------
  // Applying a format to a captured selection
  // ---------------------------------------------------------------------
  function isTextField(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT' && /^(text|search)$/i.test(el.type || 'text')) return true;
    return false;
  }

  // LinkedIn's post/comment editor lives inside an *open* Shadow DOM
  // (data-testid="interop-shadowdom"). document.getSelection() does not
  // reflect what's actually selected in there — it returns a stale,
  // unrelated, collapsed range. Each ShadowRoot has its own getSelection(),
  // so we have to walk down through document.activeElement's shadow chain
  // to find the selection that is actually live.
  function getDeepSelectionContext() {
    let root = document;
    let active = document.activeElement;
    while (active && active.shadowRoot) {
      root = active.shadowRoot;
      active = root.activeElement;
    }
    const sel = typeof root.getSelection === 'function' ? root.getSelection() : window.getSelection();
    return { active, sel };
  }

  const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  ).set;
  const nativeInputSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;

  function setNativeValue(el, value) {
    const setter = el.tagName === 'TEXTAREA' ? nativeTextareaSetter : nativeInputSetter;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // LinkedIn's post/comment editor is Quill, which keeps its own internal
  // "Delta" model — the DOM is just a render of it. Splicing the DOM
  // directly (or via execCommand, which is DOM splicing under the hood)
  // can desync from that model and get silently discarded or corrupted on
  // the next re-render. The reliable fix is to drive the real Quill
  // instance's API instead, which updates model and DOM together.
  function findReactFiberKey(node) {
    return Object.keys(node).find(
      (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );
  }

  function findQuillViaFiber(node) {
    const fiberKey = findReactFiberKey(node);
    if (!fiberKey) return null;
    let fiber = node[fiberKey];
    for (let i = 0; i < 40 && fiber; i += 1) {
      const props = fiber.memoizedProps;
      if (looksLikeQuill(props && props.quill)) return props.quill;
      const stateNode = fiber.stateNode;
      if (looksLikeQuill(stateNode && stateNode.quill)) return stateNode.quill;
      fiber = fiber.return;
    }
    return null;
  }

  // Duck-type instead of trusting a specific property name: LinkedIn's own
  // wiring (e.g. "__quill") is an implementation detail that could be
  // renamed independently of Quill itself, so we look for the actual
  // Quill instance shape (its real, documented API surface) rather than
  // a magic string.
  function looksLikeQuill(obj) {
    return (
      !!obj &&
      typeof obj.getSelection === 'function' &&
      typeof obj.getText === 'function' &&
      typeof obj.deleteText === 'function' &&
      typeof obj.insertText === 'function'
    );
  }

  function scanPropertiesForQuill(node) {
    if (!node) return null;
    if (looksLikeQuill(node.__quill)) return node.__quill;
    for (const key of Object.getOwnPropertyNames(node)) {
      if (!key.startsWith('__') && key !== 'quill') continue; // keep the scan cheap and targeted
      try {
        const value = node[key];
        if (looksLikeQuill(value)) return value;
      } catch (e) {
        // Some properties throw on access (e.g. cross-origin); skip them.
      }
    }
    return null;
  }

  function findQuillInstance(startNode) {
    let el = startNode && startNode.nodeType === Node.ELEMENT_NODE ? startNode : startNode && startNode.parentElement;
    let hops = 0;
    while (el && hops < 8) {
      // Quill's own default class names ("ql-editor"/"ql-container") are a
      // strong signal when present, but we don't require them: any
      // contenteditable ancestor is worth a duck-typed property scan, so
      // this keeps working even if those class names ever change.
      const isEditableHere = el.isContentEditable || el.getAttribute('contenteditable') === 'true';
      if (isEditableHere || (el.classList && el.classList.contains('ql-editor'))) {
        const viaProps = scanPropertiesForQuill(el);
        if (viaProps) return viaProps;
        const container = el.closest('.ql-container') || el.parentElement;
        const viaContainerProps = container && scanPropertiesForQuill(container);
        if (viaContainerProps) return viaContainerProps;
        const viaFiber = findQuillViaFiber(el) || (container && findQuillViaFiber(container));
        if (viaFiber) return viaFiber;
        if (el.classList && el.classList.contains('ql-editor')) return null; // confirmed Quill, just not reachable
      }
      el = el.parentElement;
      hops += 1;
    }
    return null;
  }

  function applyViaQuill(quill, index, length, transform) {
    const original = quill.getText(index, length);
    const formatted = transform(original);
    quill.deleteText(index, length, 'api');
    quill.insertText(index, formatted, 'api');
    quill.setSelection(index + formatted.length, 0, 'api');
  }

  function applyToContentEditable(captured, transform) {
    if (captured.quill) {
      applyViaQuill(captured.quill, captured.index, captured.length, transform);
      return;
    }

    const range = captured.range;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const original = range.toString();
    const formatted = transform(original);
    if (!original && !formatted) return; // nothing selected and nothing to insert

    const ok = document.execCommand && document.execCommand('insertText', false, formatted);
    if (!ok) {
      range.deleteContents();
      range.insertNode(document.createTextNode(formatted));
    }
  }

  function applyToInput(field, start, end, transform) {
    const original = field.value.substring(start, end);
    const formatted = transform(original);
    const before = field.value.substring(0, start);
    const after = field.value.substring(end);

    field.focus();
    field.setSelectionRange(start, end);
    const ok = document.execCommand && document.execCommand('insertText', false, formatted);
    if (!ok) {
      setNativeValue(field, before + formatted + after);
      const pos = start + formatted.length;
      field.setSelectionRange(pos, pos);
    }
  }

  // ---------------------------------------------------------------------
  // Floating panel: one row of primary buttons + a "More" row underneath
  // ---------------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    #lif-panel {
      position: fixed;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #1b1f23;
      border-radius: 8px;
      padding: 5px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      opacity: 0;
      visibility: hidden;
      transform: translateY(3px) scale(0.96);
      transition: opacity 130ms ease, transform 130ms ease;
      pointer-events: none;
    }
    #lif-panel.lif-open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    #lif-panel .lif-row {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    #lif-panel .lif-more-row,
    #lif-panel .lif-symbols-row,
    #lif-panel .lif-caret-chip {
      display: none;
    }
    #lif-panel.lif-more-open .lif-more-row {
      display: flex;
    }
    #lif-panel.lif-symbols-open .lif-symbols-row {
      display: flex;
    }
    #lif-panel .lif-wrap {
      flex-wrap: wrap;
      max-width: 200px;
    }
    /* Caret mode (no text selected, just a resting cursor): start as a
       single small chip, not the full grid, so pausing to think while
       writing doesn't throw a wall of buttons at you. The chip expands
       into the symbol grid on hover/click. */
    #lif-panel.lif-caret-mode .lif-main-row,
    #lif-panel.lif-caret-mode .lif-more-row,
    #lif-panel.lif-caret-mode .lif-symbols-row {
      display: none;
    }
    #lif-panel.lif-caret-mode .lif-caret-chip {
      display: flex;
    }
    #lif-panel.lif-caret-mode.lif-caret-expanded .lif-caret-chip {
      display: none;
    }
    #lif-panel.lif-caret-mode.lif-caret-expanded .lif-symbols-row {
      display: flex;
    }
    #lif-panel button {
      all: unset;
      box-sizing: border-box;
      min-width: 30px;
      height: 30px;
      padding: 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f5f5f5;
      font-size: 14px;
      border-radius: 5px;
      cursor: pointer;
      white-space: nowrap;
    }
    #lif-panel button:hover { background: #383d42; }
    #lif-panel button:active { background: #4a5157; }
    #lif-panel .lif-sep {
      width: 1px;
      align-self: stretch;
      background: #40454a;
      margin: 4px 2px;
      flex-shrink: 0;
    }
  `;
  document.documentElement.appendChild(style);

  const MAIN_BUTTONS = [
    { action: 'bold', label: 'B', title: 'Bold', css: 'font-weight:bold;' },
    { action: 'italic', label: 'I', title: 'Italic', css: 'font-style:italic;' },
    { action: 'underline', label: 'U', title: 'Underline', css: 'text-decoration:underline;' },
    { action: 'strikethrough', label: 'S', title: 'Strikethrough', css: 'text-decoration:line-through;' },
  ];

  const MORE_BUTTONS = [
    { action: 'monospace', label: '</>', title: 'Monospace', css: 'font-family:monospace;font-size:11px;' },
    { action: 'bullet', label: '•', title: 'Bullet list' },
    { action: 'number', label: '1.', title: 'Numbered list', css: 'font-size:11px;' },
    { action: 'hashtag', label: '#', title: 'Hashtag' },
    { action: 'mention', label: '@', title: 'Mention' },
  ];

  // Common symbols people reach for while writing LinkedIn posts (flow
  // arrows, callout pointers, checklist marks). Clicking one prefixes the
  // selected line with it (toggling off again if already there), the same
  // pattern as the bullet/numbered list buttons.
  const SYMBOLS = ['→', '←', '↳', '⇒', '➤', '▶', '✅', '❌', '⭐', '💡', '🔥', '👉'];

  function buildRow(buttons) {
    const row = document.createElement('div');
    row.className = 'lif-row';
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.title = b.title;
      btn.dataset.action = b.action;
      if (b.css) btn.style.cssText = b.css;
      row.appendChild(btn);
    });
    return row;
  }

  function buildSymbolRow(symbols) {
    const row = document.createElement('div');
    row.className = 'lif-row lif-wrap';
    symbols.forEach((symbol) => {
      const btn = document.createElement('button');
      btn.textContent = symbol;
      btn.title = `Insert ${symbol}`;
      btn.dataset.symbol = symbol;
      row.appendChild(btn);
    });
    return row;
  }

  const panel = document.createElement('div');
  panel.id = 'lif-panel';

  const mainRow = buildRow(MAIN_BUTTONS);
  mainRow.classList.add('lif-main-row');
  const sep = document.createElement('div');
  sep.className = 'lif-sep';
  mainRow.appendChild(sep);
  const moreToggle = document.createElement('button');
  moreToggle.textContent = 'More ▾';
  moreToggle.dataset.action = '__more__';
  mainRow.appendChild(moreToggle);
  const symbolsToggle = document.createElement('button');
  symbolsToggle.textContent = '→ ▾';
  symbolsToggle.title = 'Symbols';
  symbolsToggle.dataset.action = '__symbols__';
  mainRow.appendChild(symbolsToggle);

  const moreRow = buildRow(MORE_BUTTONS);
  moreRow.classList.add('lif-more-row');

  const symbolsRow = buildSymbolRow(SYMBOLS);
  symbolsRow.classList.add('lif-symbols-row');

  const caretChip = document.createElement('button');
  caretChip.className = 'lif-caret-chip';
  caretChip.textContent = '→';
  caretChip.title = 'Insert a symbol';
  caretChip.dataset.action = '__expand_caret__';

  panel.appendChild(caretChip);
  panel.appendChild(mainRow);
  panel.appendChild(moreRow);
  panel.appendChild(symbolsRow);
  document.documentElement.appendChild(panel);

  function expandCaretChip() {
    if (!panel.classList.contains('lif-caret-mode') || panel.classList.contains('lif-caret-expanded')) return;
    panel.classList.add('lif-caret-expanded');
    // The panel just grew from a single chip to the full symbol grid —
    // recenter it on the same anchor point instead of leaving it offset.
    if (lastAnchorRect) positionNear(lastAnchorRect);
  }
  caretChip.addEventListener('mouseenter', expandCaretChip);

  let savedContent = null;
  let savedInputSel = null;
  let lastAnchorRect = null;

  function positionNear(rect) {
    lastAnchorRect = rect;
    panel.style.left = '0px';
    panel.style.top = '0px';
    panel.classList.add('lif-open');
    const panelRect = panel.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - panelRect.width / 2;
    let top = rect.top - panelRect.height - 8;
    if (top < 8) top = rect.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - panelRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - panelRect.height - 8));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function closePanel() {
    panel.classList.remove('lif-open', 'lif-more-open', 'lif-symbols-open', 'lif-caret-mode', 'lif-caret-expanded');
    savedContent = null;
    savedInputSel = null;
    lastAnchorRect = null;
  }

  function applyTransform(transform) {
    if (savedContent) {
      applyToContentEditable(savedContent, transform);
    } else if (savedInputSel) {
      applyToInput(savedInputSel.el, savedInputSel.start, savedInputSel.end, transform);
    }
  }

  function toggleSymbolPrefix(symbol, text) {
    const prefix = symbol + ' ';
    return text.startsWith(prefix) ? text.slice(prefix.length) : prefix + text;
  }

  function isEditableElement(el) {
    return !!el && (el.isContentEditable || el.getAttribute('contenteditable') === 'true');
  }

  // Two ways this panel opens:
  //  - a real, non-empty text selection -> full toolbar (format + symbols)
  //  - just a resting caret (no selection) inside an editable field, after
  //    a short pause -> a compact "insert a symbol here" popup, so getting
  //    an arrow in doesn't require selecting a word first.
  // Only offer the caret-mode popup at a natural word boundary (right after
  // a space, a newline, or at the very start) — not mid-word. Pausing while
  // typing a word is normal thinking time, not a request for a symbol.
  function isWordBoundary(charBefore) {
    return !charBefore || /\s/.test(charBefore);
  }

  function enterCaretMode() {
    panel.classList.add('lif-caret-mode');
    panel.classList.remove('lif-caret-expanded');
  }

  function handleSelectionChange() {
    const { active, sel } = getDeepSelectionContext();

    if (isTextField(active)) {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (start == null || end == null) {
        closePanel();
        return;
      }
      if (start === end) {
        if (!isWordBoundary(active.value.charAt(start - 1))) {
          closePanel();
          return;
        }
        enterCaretMode();
      } else {
        panel.classList.remove('lif-caret-mode', 'lif-caret-expanded');
      }
      savedInputSel = { el: active, start, end };
      savedContent = null;
      positionNear(active.getBoundingClientRect());
      return;
    }

    if (!isEditableElement(active) || !sel || sel.rangeCount === 0) {
      closePanel();
      return;
    }

    const range = sel.getRangeAt(0);
    const isRealSelection = !sel.isCollapsed && !!sel.toString();
    const quill = findQuillInstance(range.commonAncestorContainer);

    if (quill) {
      const quillRange = quill.getSelection();
      if (!quillRange) {
        closePanel();
        return;
      }
      if (isRealSelection && quillRange.length === 0) {
        closePanel();
        return;
      }
      if (!isRealSelection) {
        const charBefore = quillRange.index > 0 ? quill.getText(quillRange.index - 1, 1) : '';
        if (!isWordBoundary(charBefore)) {
          closePanel();
          return;
        }
      }
      savedContent = { quill, index: quillRange.index, length: quillRange.length };
    } else {
      savedContent = { range: range.cloneRange() };
    }
    savedInputSel = null;
    if (isRealSelection) {
      panel.classList.remove('lif-caret-mode', 'lif-caret-expanded');
    } else {
      enterCaretMode();
    }
    positionNear(range.getBoundingClientRect());
  }

  let idleTimer = null;
  function scheduleIdleCheck() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(handleSelectionChange, 550);
  }

  panel.addEventListener('mousedown', (e) => {
    // Keep the underlying selection intact until we've re-applied it ourselves.
    e.preventDefault();
  });

  panel.addEventListener('click', (e) => {
    const symbolBtn = e.target.closest('button[data-symbol]');
    if (symbolBtn) {
      const symbol = symbolBtn.dataset.symbol;
      applyTransform((text) => toggleSymbolPrefix(symbol, text));
      closePanel();
      return;
    }

    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === '__more__') {
      panel.classList.toggle('lif-more-open');
      return;
    }
    if (action === '__symbols__') {
      panel.classList.toggle('lif-symbols-open');
      return;
    }
    if (action === '__expand_caret__') {
      expandCaretChip();
      return;
    }

    const transform = ACTIONS[action];
    if (!transform) return;

    applyTransform(transform);
    closePanel();
  });

  document.addEventListener(
    'mouseup',
    (e) => {
      if (panel.contains(e.target)) return;
      // Defer one tick so the browser has finalized the drag-selection
      // (and any editor-side selection reconciliation) before we read it.
      setTimeout(handleSelectionChange, 0);
      // Also covers a plain click that just places the caret (no drag):
      // after a short pause, offer the caret-mode symbol popup.
      scheduleIdleCheck();
    },
    true
  );

  document.addEventListener(
    'keyup',
    (e) => {
      const { active } = getDeepSelectionContext();
      if (!isTextField(active) && !isEditableElement(active)) return;
      if (e.shiftKey) {
        handleSelectionChange();
        return;
      }
      // Any other key (typing, arrow navigation): wait for a pause before
      // offering the caret-mode popup, so it doesn't fight with typing.
      closePanel();
      scheduleIdleCheck();
    },
    true
  );

  document.addEventListener(
    'input',
    () => {
      closePanel();
      scheduleIdleCheck();
    },
    true
  );

  document.addEventListener(
    'mousedown',
    (e) => {
      if (panel.contains(e.target)) return;
      clearTimeout(idleTimer);
      closePanel();
    },
    true
  );
  window.addEventListener('scroll', closePanel, true);
  window.addEventListener('resize', closePanel);
})();
