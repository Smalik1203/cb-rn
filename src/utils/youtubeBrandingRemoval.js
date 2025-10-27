// Simple YouTube branding reduction script
export const removeYouTubeBranding = `
  // Simple CSS to reduce YouTube branding without affecting controls
  const style = document.createElement('style');
  style.innerHTML = \`
    /* Reduce YouTube branding visibility - only target specific branding elements */
    .ytp-watermark {
      opacity: 0.3 !important;
      z-index: 1 !important;
    }
    
    .ytp-branding {
      opacity: 0.3 !important;
      z-index: 1 !important;
    }
    
    .ytp-branding-logo {
      opacity: 0.3 !important;
      z-index: 1 !important;
    }
    
    /* Hide some promotional elements */
    .ytp-show-cards-title {
      display: none !important;
    }
    
    .ytp-impression-link {
      display: none !important;
    }
    
    /* Make end screen less prominent */
    .ytp-endscreen-content {
      opacity: 0.5 !important;
      z-index: 1 !important;
    }
    
    .ytp-suggested-action {
      opacity: 0.5 !important;
      z-index: 1 !important;
    }
    
    /* Ensure video controls stay on top */
    .ytp-chrome-controls,
    .ytp-chrome-bottom,
    .ytp-progress-bar,
    .ytp-play-button,
    .ytp-pause-button,
    .ytp-volume-button,
    .ytp-mute-button,
    .ytp-fullscreen-button,
    .ytp-settings-button,
    .ytp-time-display {
      z-index: 10 !important;
      position: relative !important;
    }
  \`;
  document.head.appendChild(style);
  
`;
