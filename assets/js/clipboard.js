// Add to assets/js/clipboard.js
document.addEventListener('DOMContentLoaded', () => {
    const codeBlocks = document.querySelectorAll('pre[class*="language-"]');
    
    codeBlocks.forEach(block => {
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-code-button';
      copyButton.innerHTML = 'Copy';
      
      // Add button to code block
      block.parentNode.style.position = 'relative';
      block.parentNode.appendChild(copyButton);
  
      // Add click handler
      copyButton.addEventListener('click', async () => {
        try {
          const code = block.querySelector('code').textContent;
          await navigator.clipboard.writeText(code);
          copyButton.innerHTML = 'Copied!';
          setTimeout(() => {
            copyButton.innerHTML = 'Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          copyButton.innerHTML = 'Error!';
        }
      });
    });
  });