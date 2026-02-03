(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.ChatWidget) {
    console.warn('ChatWidget already initialized');
    return;
  }

  // Derive base URL from where this script was loaded
  // This ensures the widget works in production regardless of where it's embedded
  var scriptUrl = document.currentScript && document.currentScript.src;
  var defaultBaseUrl = 'http://localhost:3000'; // Fallback for dev

  if (scriptUrl) {
    try {
      var url = new URL(scriptUrl);
      defaultBaseUrl = url.origin;
    } catch (e) {
      console.warn('ChatWidget: Could not parse script URL, using fallback');
    }
  }

  var ChatWidget = {
    config: null,
    iframe: null,
    button: null,
    isOpen: false,

    init: function(config) {
      if (!config || !config.embedToken) {
        console.error('ChatWidget: embedToken is required');
        return;
      }

      this.config = Object.assign({
        position: 'bottom-right',
        baseUrl: defaultBaseUrl,
        buttonColor: '#6366f1',
        buttonSize: 60,
        zIndex: 999999
      }, config);

      this.createStyles();
      this.createButton();
      this.createIframe();
      this.bindEvents();
    },

    createStyles: function() {
      var style = document.createElement('style');
      style.textContent = [
        '.cw-button {',
        '  position: fixed;',
        '  width: ' + this.config.buttonSize + 'px;',
        '  height: ' + this.config.buttonSize + 'px;',
        '  border-radius: 50%;',
        '  background-color: ' + this.config.buttonColor + ';',
        '  border: none;',
        '  cursor: pointer;',
        '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  transition: transform 0.2s, box-shadow 0.2s;',
        '  z-index: ' + this.config.zIndex + ';',
        '}',
        '.cw-button:hover {',
        '  transform: scale(1.05);',
        '  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);',
        '}',
        '.cw-button svg {',
        '  width: 28px;',
        '  height: 28px;',
        '  fill: white;',
        '}',
        '.cw-button.cw-open svg.cw-chat-icon { display: none; }',
        '.cw-button:not(.cw-open) svg.cw-close-icon { display: none; }',
        '.cw-iframe-container {',
        '  position: fixed;',
        '  width: 380px;',
        '  height: 550px;',
        '  max-height: calc(100vh - 100px);',
        '  max-width: calc(100vw - 20px);',
        '  border-radius: 16px;',
        '  overflow: hidden;',
        '  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);',
        '  z-index: ' + (this.config.zIndex - 1) + ';',
        '  opacity: 0;',
        '  transform: translateY(20px) scale(0.95);',
        '  transition: opacity 0.2s, transform 0.2s;',
        '  pointer-events: none;',
        '}',
        '.cw-iframe-container.cw-open {',
        '  opacity: 1;',
        '  transform: translateY(0) scale(1);',
        '  pointer-events: auto;',
        '}',
        '.cw-iframe-container iframe {',
        '  width: 100%;',
        '  height: 100%;',
        '  border: none;',
        '}',
        '@media (max-width: 480px) {',
        '  .cw-iframe-container {',
        '    width: 100%;',
        '    height: calc(100vh - 80px);',
        '    max-height: none;',
        '    border-radius: 0;',
        '    top: 0 !important;',
        '    left: 0 !important;',
        '    right: 0 !important;',
        '  }',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    },

    createButton: function() {
      var button = document.createElement('button');
      button.className = 'cw-button';
      button.setAttribute('aria-label', 'Open chat');

      // Chat icon (message bubble)
      button.innerHTML = [
        '<svg class="cw-chat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
        '  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>',
        '</svg>',
        '<svg class="cw-close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
        '  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
        '</svg>'
      ].join('');

      // Position button
      var pos = this.config.position.split('-');
      button.style[pos[0]] = '20px';
      button.style[pos[1]] = '20px';

      document.body.appendChild(button);
      this.button = button;
    },

    createIframe: function() {
      var container = document.createElement('div');
      container.className = 'cw-iframe-container';

      var iframe = document.createElement('iframe');
      iframe.src = this.config.baseUrl + '/widget?token=' + encodeURIComponent(this.config.embedToken);
      iframe.setAttribute('allow', 'microphone');
      iframe.setAttribute('title', 'Chat Widget');

      container.appendChild(iframe);

      // Position iframe
      var pos = this.config.position.split('-');
      var buttonSize = this.config.buttonSize;
      container.style[pos[0]] = (20 + buttonSize + 15) + 'px';
      container.style[pos[1]] = '20px';

      document.body.appendChild(container);
      this.iframe = container;
    },

    bindEvents: function() {
      var self = this;

      this.button.addEventListener('click', function() {
        self.toggle();
      });

      // Close on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) {
          self.close();
        }
      });
    },

    toggle: function() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open: function() {
      this.isOpen = true;
      this.button.classList.add('cw-open');
      this.iframe.classList.add('cw-open');
      this.button.setAttribute('aria-label', 'Close chat');
    },

    close: function() {
      this.isOpen = false;
      this.button.classList.remove('cw-open');
      this.iframe.classList.remove('cw-open');
      this.button.setAttribute('aria-label', 'Open chat');
    },

    destroy: function() {
      if (this.button) {
        this.button.remove();
      }
      if (this.iframe) {
        this.iframe.remove();
      }
      this.config = null;
      this.isOpen = false;
    }
  };

  window.ChatWidget = ChatWidget;
})();
