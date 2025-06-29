const contentLogger = {
  info: (msg, data) => console.log(`[Breathe Content] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[Breathe Content] ${msg}`, data || ''),
  error: (msg, error, data) =>
    console.error(`[Breathe Content] ${msg}`, error, data || ''),
  debug: (msg, data) => console.debug(`[Breathe Content] ${msg}`, data || ''),
};

const ACTIVITIES = [
  {
    id: '1',
    text: 'Take 5 deep breaths and notice how you feel',
    category: 'micro-break',
    timeOfDay: ['morning', 'afternoon', 'evening'],
    duration: 2,
  },
  {
    id: '2',
    text: 'Stretch your arms and shoulders',
    category: 'physical',
    timeOfDay: ['morning', 'afternoon', 'evening'],
    duration: 3,
  },
  {
    id: '3',
    text: "Write down one thing you're grateful for",
    category: 'mental',
    timeOfDay: ['morning', 'afternoon', 'evening'],
    duration: 5,
  },
];

const TARGET_SITES = [
  /^https?:\/\/.*\.?facebook\.com/,
  /^https?:\/\/.*\.?instagram\.com/,
  /^https?:\/\/.*\.?(twitter|x)\.com/,
  /^https?:\/\/.*\.?tiktok\.com/,
];

const isTargetSite = (url) => TARGET_SITES.some((pattern) => pattern.test(url));

const getSiteKey = (hostname) => {
  const cleanHostname = hostname.replace('www.', '');
  if (cleanHostname.includes('instagram.com')) return 'instagram';
  if (cleanHostname.includes('facebook.com')) return 'facebook';
  if (cleanHostname.includes('twitter.com') || cleanHostname.includes('x.com'))
    return 'twitter';
  if (cleanHostname.includes('tiktok.com')) return 'tiktok';
  return cleanHostname.split('.')[0];
};

const getRandomActivity = () =>
  ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

class InterventionManager {
  constructor() {
    this.isActive = false;
    this.currentSite = window.location.hostname;
    this.container = null;
    this.originalOverflow = null;
    this.originalPosition = null;
    this.scrollPosition = 0;
    this.init();
  }

  async init() {
    try {
      contentLogger.info('Content script initialized', {
        site: this.currentSite,
        url: window.location.href,
        readyState: document.readyState,
      });

      if (!isTargetSite(window.location.href)) {
        contentLogger.debug('Not a target site, content script inactive');
        return;
      }

      this.setupMessageListener();
      this.setupKeyboardHandlers();
      this.setupTestTrigger();

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.signalReadiness();
        });
      } else {
        this.signalReadiness();
      }

      contentLogger.info('Content script ready for intervention', {
        site: this.currentSite,
      });
    } catch (error) {
      contentLogger.error('Failed to initialize content script', error);
    }
  }

  setupTestTrigger() {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        contentLogger.info('Manual intervention trigger activated!');
        this.showIntervention();
        event.preventDefault();
      }
    });

    contentLogger.info(
      'Test trigger ready: Press Ctrl+Shift+B to test intervention'
    );
  }

  signalReadiness() {
    try {
      chrome.runtime.sendMessage({
        action: 'contentScriptReady',
        data: {
          site: getSiteKey(this.currentSite),
          url: window.location.href,
          timestamp: Date.now(),
        },
      });
      contentLogger.debug('Content script readiness signaled');
    } catch (error) {
      contentLogger.warn('Failed to signal readiness', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'showIntervention') {
        this.handleInterventionRequest()
          .then(() => sendResponse({ success: true }))
          .catch((error) => {
            contentLogger.error('Failed to handle intervention request', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      }
    });
  }

  setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isActive) {
        this.hideIntervention();
      }
    });
  }

  lockScroll() {
    this.scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;

    this.pageHasScroll =
      document.body.scrollHeight > window.innerHeight ||
      document.documentElement.scrollHeight > window.innerHeight;

    this.originalBodyOverflow = document.body.style.overflow;
    this.originalBodyPosition = document.body.style.position;
    this.originalBodyTop = document.body.style.top;
    this.originalBodyLeft = document.body.style.left;
    this.originalBodyRight = document.body.style.right;
    this.originalBodyWidth = document.body.style.width;
    this.originalBodyHeight = document.body.style.height;
    this.originalHtmlOverflow = document.documentElement.style.overflow;

    const bodyComputedStyle = window.getComputedStyle(document.body);
    const htmlComputedStyle = window.getComputedStyle(document.documentElement);
    this.originalBodyOverflowComputed = bodyComputedStyle.overflow;
    this.originalHtmlOverflowComputed = htmlComputedStyle.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    document.documentElement.style.overflow = 'hidden';

    this.touchMoveHandler = (e) => e.preventDefault();
    document.addEventListener('touchmove', this.touchMoveHandler, {
      passive: false,
    });

    this.wheelHandler = (e) => e.preventDefault();
    document.addEventListener('wheel', this.wheelHandler, { passive: false });

    contentLogger.debug('Scroll locked (enhanced)', {
      scrollPosition: this.scrollPosition,
      pageHasScroll: this.pageHasScroll,
    });
  }

  unlockScroll() {
    if (this.touchMoveHandler) {
      document.removeEventListener('touchmove', this.touchMoveHandler);
      this.touchMoveHandler = null;
    }
    if (this.wheelHandler) {
      document.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }

    document.body.style.position = this.originalBodyPosition || '';
    document.body.style.top = this.originalBodyTop || '';
    document.body.style.left = this.originalBodyLeft || '';
    document.body.style.right = this.originalBodyRight || '';
    document.body.style.width = this.originalBodyWidth || '';
    document.body.style.height = this.originalBodyHeight || '';

    if (this.pageHasScroll) {
      document.body.style.overflow = this.originalBodyOverflow || '';
      document.documentElement.style.overflow = this.originalHtmlOverflow || '';
    } else {
      if (
        this.originalBodyOverflow &&
        !['hidden', 'auto', 'scroll'].includes(this.originalBodyOverflow)
      ) {
        document.body.style.overflow = '';
      } else {
        document.body.style.overflow = this.originalBodyOverflow || '';
      }

      if (
        this.originalHtmlOverflow &&
        !['hidden', 'auto', 'scroll'].includes(this.originalHtmlOverflow)
      ) {
        document.documentElement.style.overflow = '';
      } else {
        document.documentElement.style.overflow =
          this.originalHtmlOverflow || '';
      }
    }

    requestAnimationFrame(() => {
      const hasScrollAfterRestore =
        document.body.scrollHeight > window.innerHeight ||
        document.documentElement.scrollHeight > window.innerHeight;

      if (!this.pageHasScroll && hasScrollAfterRestore) {
        document.body.style.overflow = 'visible';
        document.documentElement.style.overflow = 'visible';

        contentLogger.debug('Forced scrollbar removal on non-scrolling page');
      }

      if (this.scrollPosition > 0) {
        window.scrollTo(0, this.scrollPosition);
      }
    });

    contentLogger.debug('Scroll unlocked (enhanced)', {
      scrollPosition: this.scrollPosition,
      pageHasScroll: this.pageHasScroll,
    });
  }

  async handleInterventionRequest() {
    try {
      if (this.isActive) {
        contentLogger.debug('Intervention already active, ignoring request');
        return;
      }

      this.isActive = true;
      contentLogger.debug('Starting intervention display');

      await this.showIntervention();
    } catch (error) {
      contentLogger.error('Failed to handle intervention request', error);
      this.isActive = false;
      throw error;
    }
  }

  async showIntervention() {
    try {
      this.container = document.createElement('div');
      this.container.id = 'breathe-intervention-root';
      this.container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 41, 59, 0.9)) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', system-ui, sans-serif !important;
        padding: 1rem !important;
        opacity: 0 !important;
        transform: translate3d(0, 0, 0) !important;
      `;

      const activity = getRandomActivity();

      this.container.innerHTML = `
        <div style="
          background: linear-gradient(145deg, #1f2937, #111827);
          border-radius: 20px;
          padding: 2.5rem;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.15);
        ">
          <button id="escape-btn" style="
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            color: #9ca3af;
            border: none;
            width: 1.5rem;
            height: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 4px;
            font-size: 1.25rem;
            transition: all 0.2s ease;
          ">
            x
          </button>

          <div style="margin-bottom: 2.5rem;">
            <h1 style="
              font-size: 1.75rem;
              font-weight: 700;
              margin: 0 0 0.75rem 0;
              color: #f9fafb;
              line-height: 1.2;
              letter-spacing: -0.025em;
            ">
              Take a Breath
            </h1>
            <p style="
              margin: 0;
              font-size: 1rem;
              color: #d1d5db;
              line-height: 1.5;
              max-width: 320px;
              margin: 0 auto;
            ">
              ${activity.text}
            </p>
          </div>

          <div style="margin: 2.5rem 0;">
            <div style="
              width: 100px;
              height: 100px;
              background: linear-gradient(135deg, #10b981, #059669);
              border-radius: 50%;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 8px 25px -8px rgba(16, 185, 129, 0.5);
              animation: iconPulse 2s ease-in-out infinite;
            ">
              <span style="font-size: 2rem; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)); margin-bottom: 0.5rem">🌱</span>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; flex-direction: column;">
            <button id="continue-btn" style="
              padding: 1rem 2rem;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              border: none;
              border-radius: 12px;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.95rem;
              transition: all 0.2s ease;
              box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);
              letter-spacing: 0.025em;
            ">
              Continue Browsing
            </button>
            <button id="close-btn" style="
              padding: 1rem 2rem;
              background: rgba(55, 65, 81, 0.8);
              color: #d1d5db;
              border: 1px solid rgba(75, 85, 99, 0.8);
              border-radius: 12px;
              cursor: pointer;
              font-size: 0.95rem;
              font-weight: 500;
              transition: all 0.2s ease;
              backdrop-filter: blur(8px);
              letter-spacing: 0.025em;
            ">
              Close Tab
            </button>
          </div>
        </div>

        <style>
          #breathe-intervention-root * {
            backface-visibility: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate3d(0, 0, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate3d(0, 20px, 0) scale3d(0.96, 0.96, 1);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            }
          }


          @keyframes iconPulse {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
              box-shadow: 0 8px 25px -8px rgba(16, 185, 129, 0.5);
            }
            50% {
              transform: translate3d(0, 0, 0) scale3d(1.03, 1.03, 1);
              box-shadow: 0 12px 35px -8px rgba(16, 185, 129, 0.7);
            }
          }


          #continue-btn {
            will-change: transform, background, box-shadow;
            transform: translate3d(0, 0, 0);
            transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          #continue-btn:hover {
            background: linear-gradient(135deg, #047857, #065f46);
            transform: translate3d(0, -2px, 0);
            box-shadow: 0 8px 25px 0 rgba(16, 185, 129, 0.4);
          }

          #continue-btn:active {
            transform: translate3d(0, 0, 0);
            box-shadow: 0 2px 8px 0 rgba(16, 185, 129, 0.3);
            transition: all 0.08s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          #close-btn {
            will-change: transform, background, box-shadow;
            transform: translate3d(0, 0, 0);
            transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          #close-btn:hover {
            background: rgba(75, 85, 99, 0.9);
            border-color: rgba(107, 114, 128, 0.9);
            color: #f3f4f6;
            transform: translate3d(0, -2px, 0);
            box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.3);
          }

          #close-btn:active {
            transform: translate3d(0, 0, 0);
            box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
            transition: all 0.08s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          #escape-btn {
            will-change: transform, background;
            transform: translate3d(0, 0, 0);
            transition: all 0.12s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          #escape-btn:hover {
            background: rgba(75, 85, 99, 0.6);
            color: #f3f4f6;
            transform: translate3d(0, 0, 0) scale3d(1.1, 1.1, 1);
          }

          #escape-btn:active {
            transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            transition: all 0.06s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          @media (max-width: 480px) {
            #breathe-intervention-root {
              padding: 0.5rem !important;
            }

            #breathe-intervention-root > div {
              padding: 2rem 1.5rem !important;
              max-width: none !important;
              margin: 0.5rem;
            }

          }
        </style>
      `;

      this.container
        .querySelector('#continue-btn')
        .addEventListener('click', () => {
          this.handleInterventionComplete('continued', 'neutral');
        });

      this.container
        .querySelector('#close-btn')
        .addEventListener('click', () => {
          this.handleInterventionComplete('closed', 'neutral');
        });

      this.container
        .querySelector('#escape-btn')
        .addEventListener('click', () => {
          this.hideIntervention();
        });

      document.body.appendChild(this.container);

      this.lockScroll();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.container.style.transition =
            'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          this.container.style.opacity = '1';
          this.container.style.backdropFilter = 'blur(12px)';

          contentLogger.info('Intervention displayed', {
            site: this.currentSite,
          });
        });
      });
    } catch (error) {
      this.isActive = false;
      contentLogger.error('Failed to show intervention', error);
      throw error;
    }
  }

  async handleInterventionComplete(action, emotionalState) {
    try {
      const interventionData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        site: getSiteKey(this.currentSite),
        actionTaken: action,
        emotionalState: emotionalState,
        interventionDuration: 15,
        timeOfDay: getTimeOfDay(),
      };

      chrome.runtime.sendMessage({
        action: 'logIntervention',
        data: interventionData,
      });

      contentLogger.info('Intervention completed', {
        action,
        emotionalState,
        site: this.currentSite,
      });

      this.hideIntervention();

      if (action === 'closed') {
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'closeTab',
          });
        }, 100);
      }
    } catch (error) {
      contentLogger.error('Failed to handle intervention completion', error);
    }
  }

  hideIntervention() {
    try {
      if (this.container?.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }
      this.unlockScroll();
      this.isActive = false;
      contentLogger.info('Intervention hidden');
    } catch (error) {
      contentLogger.error('Failed to hide intervention', error);
    }
  }

  getIsActive() {
    return this.isActive;
  }
}

const interventionManager = new InterventionManager();

window.__breatheBeforeBrowse = {
  interventionManager,
  isActive: () => interventionManager.getIsActive(),
  hide: () => interventionManager.hideIntervention(),
};
