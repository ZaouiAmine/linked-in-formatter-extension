// LinkedIn Post Formatter
(function() {
  'use strict';

  // Inject CSS styles
  const style = document.createElement('style');
  style.textContent = `
    #linkedin-formatter-toolbar {
      display: flex !important;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #ffffff !important;
      border-bottom: 1px solid #e0e0e0;
      flex-wrap: wrap;
      z-index: 9999 !important;
      position: sticky !important;
      top: 0 !important;
      margin: 0 !important;
      width: 100%;
      box-sizing: border-box;
      visibility: visible !important;
      opacity: 1 !important;
    }
    #linkedin-formatter-toolbar .fmt-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      color: #666;
      font-size: 16px;
    }
    #linkedin-formatter-toolbar .fmt-btn:hover {
      background: #f3f2ef !important;
    }
    #linkedin-formatter-toolbar .fmt-btn:active {
      background: #e9ecef !important;
      transform: scale(0.95);
    }
    #linkedin-formatter-counter {
      font-size: 12px;
      color: #666;
      padding: 0 8px;
      font-weight: 500;
    }
    #linkedin-formatter-counter.over-limit {
      color: #d32f2f;
      font-weight: 700;
    }
    .artdeco-modal__content #linkedin-formatter-toolbar,
    .share-box #linkedin-formatter-toolbar {
      position: relative !important;
      display: flex !important;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);

  const UnicodeFormatter = {
    // Convert Unicode back to normal letter for processing
    unicodeToNormal(char) {
      const code = char.codePointAt(0);
      // Detect various Unicode ranges and convert to normal
      if (code >= 0x1D400 && code <= 0x1D7FF) { // Mathematical Unicode blocks
        // Bold Italic Upper (0x1D63C-0x1D655)
        if (code >= 0x1D63C && code <= 0x1D655) return String.fromCharCode(65 + (code - 0x1D63C));
        // Bold Italic Lower (0x1D656-0x1D66F)
        if (code >= 0x1D656 && code <= 0x1D66F) return String.fromCharCode(97 + (code - 0x1D656));
        // Bold Upper (0x1D5D4-0x1D5ED)
        if (code >= 0x1D5D4 && code <= 0x1D5ED) return String.fromCharCode(65 + (code - 0x1D5D4));
        // Bold Lower (0x1D5EE-0x1D607)
        if (code >= 0x1D5EE && code <= 0x1D607) return String.fromCharCode(97 + (code - 0x1D5EE));
        // Italic Upper (0x1D608-0x1D621)
        if (code >= 0x1D608 && code <= 0x1D621) return String.fromCharCode(65 + (code - 0x1D608));
        // Italic Lower (0x1D622-0x1D63B)
        if (code >= 0x1D622 && code <= 0x1D63B) return String.fromCharCode(97 + (code - 0x1D622));
        // Monospace Upper (0x1D670-0x1D689)
        if (code >= 0x1D670 && code <= 0x1D689) return String.fromCharCode(65 + (code - 0x1D670));
        // Monospace Lower (0x1D68A-0x1D6A3)
        if (code >= 0x1D68A && code <= 0x1D6A3) return String.fromCharCode(97 + (code - 0x1D68A));
      }
      return char;
    },
    
    // Check if text is already formatted in a specific style
    isFormatted(text, style) {
      if (!text || text.length === 0) return false;
      const code = text.codePointAt(0);
      
      switch(style) {
        case 'bold':
          return (code >= 0x1D5D4 && code <= 0x1D5ED) || // Bold Upper
                 (code >= 0x1D5EE && code <= 0x1D607) || // Bold Lower
                 (code >= 0x1D63C && code <= 0x1D66F);  // Bold Italic
        case 'italic':
          return (code >= 0x1D608 && code <= 0x1D621) || // Italic Upper
                 (code >= 0x1D622 && code <= 0x1D63B) || // Italic Lower
                 (code >= 0x1D63C && code <= 0x1D66F);  // Bold Italic
        case 'underline':
          return text.includes('\u0332');
        case 'strikethrough':
          return text.includes('\u0335');
        case 'monospace':
          return (code >= 0x1D670 && code <= 0x1D689) || // Monospace Upper
                 (code >= 0x1D68A && code <= 0x1D6A3);   // Monospace Lower
        default:
          return false;
      }
    },
    
    // Convert text to bold - ALWAYS normalize first then toggle
    toBold(text) {
      // Check if already bold before normalizing
      const isAlreadyBold = this.isFormatted(text, 'bold');
      
      // Always normalize to ASCII first (removes all formatting)
      const normalized = text.split('').map(char => this.unicodeToNormal(char)).join('');
      
      // If was already bold, return normalized (toggle off)
      if (isAlreadyBold) {
        return normalized;
      }
      
      // Apply bold to normalized text (toggle on)
      return normalized.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D5D4 + (code - 65)); // A-Z
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D5EE + (code - 97)); // a-z
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7EC + (code - 48)); // 0-9
        return char;
      }).join('');
    },
    
    // Convert text to italic - ALWAYS normalize first then toggle
    toItalic(text) {
      // Check if already italic before normalizing
      const isAlreadyItalic = this.isFormatted(text, 'italic');
      
      // Always normalize to ASCII first (removes all formatting)
      const normalized = text.split('').map(char => this.unicodeToNormal(char)).join('');
      
      // If was already italic, return normalized (toggle off)
      if (isAlreadyItalic) {
        return normalized;
      }
      
      // Apply italic to normalized text (toggle on)
      return normalized.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D608 + (code - 65)); // A-Z
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D622 + (code - 97)); // a-z
        return char;
      }).join('');
    },
    
    // Convert text to bold italic - ALWAYS normalize first
    toBoldItalic(text) {
      // First normalize to ASCII
      const normalized = text.split('').map(char => this.unicodeToNormal(char)).join('');
      // Apply bold italic to normalized text
      return normalized.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D63C + (code - 65)); // A-Z
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D656 + (code - 97)); // a-z
        return char;
      }).join('');
    },
    
    toUnderline(text) {
      // Check if already underlined before normalizing
      const isAlreadyUnderlined = this.isFormatted(text, 'underline');
      
      // Always normalize to ASCII first (removes all formatting)
      const normalized = text.split('').map(char => this.unicodeToNormal(char)).join('');
      
      // If was already underlined, return normalized (toggle off)
      if (isAlreadyUnderlined) {
        return normalized;
      }
      
      // Apply underline to normalized text (toggle on)
      return normalized.split('').map(char => char + '\u0332').join('');
    },
    
    toStrikethrough(text) {
      // Check if already strikethrough before normalizing
      const isAlreadyStrikethrough = this.isFormatted(text, 'strikethrough');
      
      // Always normalize to ASCII first (removes all formatting)
      const normalized = text.split('').map(char => this.unicodeToNormal(char)).join('');
      
      // If was already strikethrough, return normalized (toggle off)
      if (isAlreadyStrikethrough) {
        return normalized;
      }
      
      // Apply strikethrough using combining long stroke overlay (better centering)
      return normalized.split('').map(char => char + '\u0335').join('');
    },
    
    toMonospace(text) {
      // Check if already monospace before normalizing
      const isAlreadyMonospace = this.isFormatted(text, 'monospace');
      
      // Always normalize to ASCII first (removes all formatting)
      const normalized = text.split('').map(char => this.unicodeToNormal(char)).join('');
      
      // If was already monospace, return normalized (toggle off)
      if (isAlreadyMonospace) {
        return normalized;
      }
      
      // Apply monospace to normalized text (toggle on)
      return normalized.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D670 + (code - 65)); // A-Z
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D68A + (code - 97)); // a-z
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7F6 + (code - 48)); // 0-9
        return char;
      }).join('');
    }
  };

  let currentEditor = null;
  let toolbarElement = null;
  let checkInterval = null;
  let observer = null;

  function findEditor() {
    const selectors = [
      '.share-box .ql-editor[contenteditable="true"]',
      '.share-box [contenteditable="true"]',
      '.share-box textarea',
      '.ql-editor[contenteditable="true"]',
      '[contenteditable="true"][data-placeholder*="What" i]',
      '[contenteditable="true"][data-placeholder*="post" i]',
      'textarea[placeholder*="What" i]',
      'textarea[placeholder*="post" i]',
      '.ql-editor',
      '[contenteditable="true"]'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        if (rect.width > 0 && rect.height > 0 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden' &&
            style.opacity !== '0') {
          
          const inShareBox = el.closest('.share-box') !== null;
          const hasPlaceholder = el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || '';
          
          if (inShareBox || hasPlaceholder.toLowerCase().includes('what') || hasPlaceholder.toLowerCase().includes('post')) {
            return el;
          }
        }
      }
    }
    
    return null;
  }

  function createToolbar() {
    if (toolbarElement) return toolbarElement;
    
    const toolbar = document.createElement('div');
    toolbar.id = 'linkedin-formatter-toolbar';
    toolbar.style.cssText = `
      display: flex !important;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #ffffff !important;
      border-bottom: 1px solid #e0e0e0;
      flex-wrap: wrap;
      z-index: 99999 !important;
      position: sticky !important;
      top: 0 !important;
      margin: 0 !important;
      width: 100%;
      box-sizing: border-box;
    `;

    toolbar.innerHTML = `
      <button data-action="bold" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-weight:bold;font-size:18px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" title="Bold">B</button>
      <button data-action="italic" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-style:italic;font-size:18px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" title="Italic">I</button>
      <button data-action="underline" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;text-decoration:underline;font-size:14px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;font-weight:600;" title="Underline">U</button>
      <button data-action="strikethrough" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;text-decoration:line-through;font-size:14px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;font-weight:600;" title="Strikethrough">S</button>
      <button data-action="monospace" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-family:monospace;font-size:14px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;font-weight:600;" title="Monospace">M</button>
      <div style="width:1px;height:24px;background:#e0e0e0;margin:0 8px;"></div>
      <button data-action="bullet" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-size:20px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" title="Bullet List">•</button>
      <button data-action="number" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-size:14px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;font-weight:600;" title="Numbered List">1.</button>
      <div style="width:1px;height:24px;background:#e0e0e0;margin:0 8px;"></div>
      <button data-action="hashtag" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-size:18px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;font-weight:700;" title="Hashtag">#</button>
      <button data-action="mention" class="fmt-btn" style="width:40px;height:40px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-size:16px;color:#666;display:flex;align-items:center;justify-content:center;transition:all 0.2s;font-weight:700;" title="Mention">@</button>
      <div style="width:1px;height:24px;background:#e0e0e0;margin:0 8px;"></div>
      <span id="linkedin-formatter-counter" style="font-size:12px;color:#666;padding:0 8px;font-weight:600;">0</span>
    `;
    
    // Add hover effects
    toolbar.querySelectorAll('.fmt-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#f3f2ef';
        btn.style.color = '#000';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
        btn.style.color = '#666';
      });
      btn.addEventListener('mousedown', () => {
        btn.style.background = '#e0e0e0';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.background = '#f3f2ef';
      });
    });

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn && currentEditor) {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        applyFormatSimple(action);
      }
    });

    toolbarElement = toolbar;
    return toolbar;
  }

  // Direct approach: Delete selected text and insert formatted text
  function applyFormatSimple(action) {
    if (!currentEditor) {
      return;
    }

    try {
      const isTextarea = currentEditor.tagName === 'TEXTAREA';
      
      // Get selected text
      let selectedText = '';
      let start = 0;
      let end = 0;
      
      if (isTextarea) {
        start = currentEditor.selectionStart || 0;
        end = currentEditor.selectionEnd || 0;
        selectedText = currentEditor.value.substring(start, end);
      } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          selectedText = selection.toString();
          const range = selection.getRangeAt(0);
          start = 0;
          end = selectedText.length;
        }
      }
      
      if (!selectedText) {
        showFeedback('Please select text first');
        return;
      }
      
      // Apply formatting
      let formatted = '';
      switch(action) {
        case 'bold': 
          formatted = UnicodeFormatter.toBold(selectedText);
          break;
        case 'italic': 
          formatted = UnicodeFormatter.toItalic(selectedText);
          break;
        case 'underline': 
          formatted = UnicodeFormatter.toUnderline(selectedText);
          break;
        case 'strikethrough': 
          formatted = UnicodeFormatter.toStrikethrough(selectedText);
          break;
        case 'monospace': 
          formatted = UnicodeFormatter.toMonospace(selectedText);
          break;
        case 'bullet': 
          formatted = selectedText.split('\n').map(line => 
            line.trim() ? '• ' + line.trim() : ''
          ).filter(Boolean).join('\n');
          break;
        case 'number': 
          formatted = selectedText.split('\n').map((line, i) => 
            line.trim() ? `${i + 1}. ${line.trim()}` : ''
          ).filter(Boolean).join('\n');
          break;
        case 'hashtag': 
          formatted = '#' + selectedText.trim();
          break;
        case 'mention': 
          formatted = '@' + selectedText.trim();
          break;
        default: 
          return;
      }
      
      // Replace selected text with formatted text directly
      if (isTextarea) {
        const before = currentEditor.value.substring(0, start);
        const after = currentEditor.value.substring(end);
        currentEditor.value = before + formatted + after;
        
        // Position cursor after inserted text
        const newPos = start + formatted.length;
        currentEditor.setSelectionRange(newPos, newPos);
        currentEditor.focus();
        
        // Trigger input event
        currentEditor.dispatchEvent(new Event('input', { bubbles: true }));
        currentEditor.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // For contenteditable
        currentEditor.focus();
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Delete selected content
          range.deleteContents();
          
          // Insert formatted text
          const textNode = document.createTextNode(formatted);
          range.insertNode(textNode);
          
          // Position cursor after inserted text
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Trigger multiple input events to make sure LinkedIn notices
          const events = ['input', 'change', 'keyup', 'keydown'];
          events.forEach(eventType => {
            currentEditor.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
        }
      }
      
      showFeedback('✓ Formatted!');
    } catch (error) {
      showFeedback('✗ Error');
    }
  }
  
  function showFeedback(message) {
    if (!toolbarElement) return;
    
    let feedback = toolbarElement.querySelector('.feedback-msg');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'feedback-msg';
      feedback.style.cssText = `
        font-size: 11px;
        color: #0073b1;
        font-weight: 600;
        margin-left: 8px;
      `;
      toolbarElement.appendChild(feedback);
    }
    
    feedback.textContent = message;
    
    setTimeout(() => {
      feedback.textContent = '';
    }, 3000);
  }

  function updateCounter() {
    if (!currentEditor || !toolbarElement) return;
    const counter = toolbarElement.querySelector('#linkedin-formatter-counter');
    if (!counter) return;
    
    const text = currentEditor.tagName === 'TEXTAREA' 
      ? currentEditor.value 
      : (currentEditor.textContent || '');
    counter.textContent = text.length;
    counter.style.color = text.length > 3000 ? '#d32f2f' : '#666';
  }

  function injectToolbar() {
    if (!currentEditor) return;
    
    const existing = document.getElementById('linkedin-formatter-toolbar');
    if (existing && existing.isConnected && currentEditor.isConnected) {
      toolbarElement = existing;
      return;
    }

    if (existing && !existing.isConnected) {
      existing.remove();
      toolbarElement = null;
    }

    if (!toolbarElement) {
      toolbarElement = createToolbar();
    }
    
    let parent = null;
    let insertBefore = null;

    const wrapper = currentEditor.closest('.share-creation-state__text-editor');
    if (wrapper && wrapper.parentNode) {
      parent = wrapper.parentNode;
      insertBefore = wrapper;
    } else {
      const container = currentEditor.closest('.editor-container');
      if (container && container.parentNode) {
        parent = container.parentNode;
        insertBefore = container;
      } else if (currentEditor.parentNode) {
        parent = currentEditor.parentNode;
        insertBefore = currentEditor;
      }
    }

    if (parent && insertBefore) {
      try {
        parent.insertBefore(toolbarElement, insertBefore);
      } catch (e) {
        if (parent.firstChild) {
          parent.insertBefore(toolbarElement, parent.firstChild);
        } else {
          parent.appendChild(toolbarElement);
        }
      }
    } else {
      return;
    }

    currentEditor.addEventListener('input', updateCounter);
    currentEditor.addEventListener('keyup', updateCounter);
    updateCounter();
  }

  function checkAndInject() {
    const editor = findEditor();

    if (!editor) {
      if (currentEditor) {
        currentEditor = null;
        if (toolbarElement && toolbarElement.parentNode) {
          toolbarElement.remove();
          toolbarElement = null;
        }
      }
      return;
    }

    if (editor !== currentEditor) {
      if (toolbarElement && toolbarElement.parentNode && currentEditor && !currentEditor.isConnected) {
        toolbarElement.remove();
        toolbarElement = null;
      }

      currentEditor = editor;
      injectToolbar();
    } else if (currentEditor && (!toolbarElement || !toolbarElement.isConnected)) {
      injectToolbar();
    }
  }

  function init() {
    checkAndInject();

    checkInterval = setInterval(() => {
      checkAndInject();
    }, 300);

    observer = new MutationObserver(() => {
      checkAndInject();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    document.addEventListener('focusin', (e) => {
      const target = e.target;
      if (target && (target.contentEditable === 'true' || target.tagName === 'TEXTAREA')) {
        setTimeout(checkAndInject, 50);
      }
    });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setTimeout(checkAndInject, 1000);
  setTimeout(checkAndInject, 3000);

})();
