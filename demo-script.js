// LinkedIn Post Formatter — autonomous demo script
//
// HOW TO USE:
//   1. Load the extension (chrome://extensions -> Load unpacked -> this folder)
//   2. Go to LinkedIn, click "Start a post" to open the composer
//   3. Click into the empty post box once (so it's focused)
//   4. Open DevTools (F12) -> Console tab
//   5. Paste this entire script and press Enter
//   6. Start your screen recording *before* step 5, or right after pasting
//      and before it finishes the 2-second startup delay below.
//
// It types a real post, letter by letter, then selects words and clicks the
// extension's own toolbar buttons for real (Bold, Italic, Underline,
// Strikethrough, Hashtag, Mention, Bullet list), and finally demonstrates
// the caret-idle symbol popup. No further input needed once it starts.

(async function runDemo() {
  'use strict';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => min + Math.random() * (max - min);

  function getEditor() {
    const host = document.querySelector('[data-testid="interop-shadowdom"]');
    const root = host ? host.shadowRoot : document;
    const editor = root.querySelector('.ql-editor, [contenteditable="true"]');
    if (!editor) throw new Error('Could not find the post editor. Click into the post box first.');
    return editor;
  }

  function getSel() {
    const host = document.querySelector('[data-testid="interop-shadowdom"]');
    const root = host ? host.shadowRoot : document;
    return typeof root.getSelection === 'function' ? root.getSelection() : window.getSelection();
  }

  async function typeChar(char) {
    // execCommand('insertText') already fires a real 'input' event, which
    // is all the extension needs to reset its own idle-detection timer —
    // no synthetic keyup required.
    document.execCommand('insertText', false, char);
  }

  async function typeText(text, { min = 45, max = 140 } = {}) {
    const editor = getEditor();
    editor.focus();
    for (const char of text) {
      await typeChar(char);
      await sleep(rand(min, max));
    }
  }

  function textNodesUnder(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function locate(el, targetOffset) {
    let remaining = targetOffset;
    const nodes = textNodesUnder(el);
    for (const node of nodes) {
      const len = node.textContent.length;
      if (remaining <= len) return { node, offset: remaining };
      remaining -= len;
    }
    const last = nodes[nodes.length - 1];
    return { node: last, offset: last ? last.textContent.length : 0 };
  }

  // Selects the first occurrence of `word` in the editor's current text and
  // dispatches a real mouseup, exactly like a human drag-selection would,
  // so the extension's own listeners pick it up naturally.
  async function selectWord(word) {
    const editor = getEditor();
    const text = editor.textContent;
    const start = text.indexOf(word);
    if (start === -1) throw new Error(`Could not find "${word}" in the post text.`);
    const end = start + word.length;

    const range = document.createRange();
    const startLoc = locate(editor, start);
    const endLoc = locate(editor, end);
    range.setStart(startLoc.node, startLoc.offset);
    range.setEnd(endLoc.node, endLoc.offset);

    const sel = getSel();
    sel.removeAllRanges();
    sel.addRange(range);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }));
    await sleep(220); // let the panel open and settle
  }

  // Selects everything between the start of `fromLine` and the end of
  // `toLine` (inclusive) — used for the bullet-list demo across 3 lines.
  async function selectLines(fromLine, toLine) {
    const editor = getEditor();
    const text = editor.textContent;
    const start = text.indexOf(fromLine);
    const toStart = text.indexOf(toLine, start);
    if (start === -1 || toStart === -1) throw new Error('Could not find the requested lines.');
    const end = toStart + toLine.length;

    const range = document.createRange();
    const startLoc = locate(editor, start);
    const endLoc = locate(editor, end);
    range.setStart(startLoc.node, startLoc.offset);
    range.setEnd(endLoc.node, endLoc.offset);

    const sel = getSel();
    sel.removeAllRanges();
    sel.addRange(range);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }));
    await sleep(220);
  }

  function panel() {
    return document.getElementById('lif-panel');
  }

  async function waitForPanelOpen(timeoutMs = 1500) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const p = panel();
      if (p && p.classList.contains('lif-open')) return p;
      await sleep(50);
    }
    throw new Error('Toolbar never appeared — is the extension loaded on this page?');
  }

  async function clickAction(action) {
    const p = await waitForPanelOpen();
    const btn = p.querySelector(`button[data-action="${action}"]`);
    if (!btn) throw new Error(`No toolbar button for action "${action}".`);
    btn.click();
    await sleep(350);
  }

  async function openMore() {
    const p = await waitForPanelOpen();
    const btn = p.querySelector('button[data-action="__more__"]');
    btn.click();
    await sleep(250);
  }

  async function pressEnter() {
    // Neither insertText('\n') nor execCommand('insertParagraph') is safe
    // here: both bypass Quill's own Keyboard module, which is what
    // actually owns "what happens on Enter" in its Delta model, and both
    // were observed to corrupt the document (content merging into the
    // wrong paragraph, cursor jumping to the top). A genuine Enter
    // keydown is what Quill's own bindings listen for, so it updates its
    // model correctly, the same as a real keypress would.
    const editor = getEditor();
    const opts = { bubbles: true, cancelable: true, composed: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 };
    editor.dispatchEvent(new KeyboardEvent('keydown', opts));
    await sleep(rand(150, 300));
  }

  async function pauseForCaretPopup() {
    // Nothing to type for a moment — this is exactly what triggers the
    // extension's caret-idle "insert a symbol" popup.
    await sleep(900);
  }

  async function insertSymbolFromCaretPopup(symbol) {
    const p = await waitForPanelOpen();
    const btn = p.querySelector(`button[data-symbol="${symbol}"]`);
    if (!btn) throw new Error(`Symbol "${symbol}" not found in the popup.`);
    btn.click();
    await sleep(350);
  }

  // ------------------------------------------------------------------
  // The demo itself
  // ------------------------------------------------------------------

  console.log('%cLinkedIn Post Formatter demo starting in 2s…', 'color:#2451ff;font-weight:bold;');
  await sleep(2000);

  await typeText('Growth is a mindset, not a milestone.');
  await pressEnter();
  await pressEnter();
  await typeText('Three things that shipped this week:');
  await pressEnter();
  await typeText('Faster onboarding');
  await pressEnter();
  await typeText('Fewer clicks');
  await pressEnter();
  await typeText('Happier users');
  await pressEnter();
  await pressEnter();
  await typeText('This was hard easy.');
  await pressEnter();
  await typeText('Thanks Sarah for leading this.');

  // Bold the opening word
  await selectWord('Growth');
  await clickAction('bold');

  // Italicize a key word
  await selectWord('mindset');
  await clickAction('italic');

  // Underline for emphasis
  await selectWord('milestone');
  await clickAction('underline');

  // Strikethrough shown as a real edit: "hard" corrected to "easy"
  await selectWord('hard');
  await clickAction('strikethrough');

  // Turn the three shipped-items lines into a bullet list
  await selectLines('Faster onboarding', 'Happier users');
  await clickAction('bullet');

  // Hashtag a keyword (via the "More" row)
  await selectWord('onboarding');
  await openMore();
  await clickAction('hashtag');

  // Mention a name (via the "More" row)
  await selectWord('Sarah');
  await openMore();
  await clickAction('mention');

  // Move to the very end, then pause to trigger the caret-idle symbol popup
  const editor = getEditor();
  editor.focus();
  document.execCommand('selectAll', false, null);
  const sel = getSel();
  sel.collapseToEnd();
  await pauseForCaretPopup();
  await insertSymbolFromCaretPopup('→');
  await typeText(' more wins coming');

  console.log('%cDemo complete.', 'color:#2451ff;font-weight:bold;');
})().catch((err) => {
  console.error('Demo script stopped:', err.message);
});
