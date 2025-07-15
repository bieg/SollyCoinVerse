// ===================================================================================
// ==                           ERROR HANDLER MODULE                              ==
// ==                                                                             ==
// ==      Centrale error handling voor het hele project:                       ==
// ==      - Gestandaardiseerde error logging                                     ==
// ==      - User-friendly error messages                                         ==
// ==      - Error tracking en monitoring                                         ==
// ==      - Fallback mechanismen                                                 ==
// ===================================================================================

class ErrorHandler {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorHistory = [];
    this.isEnabled = true;
    
    // Error types en hun fallback waardes
    this.errorTypes = {
      CONFIG_LOADING: {
        fallback: () => this.getDefaultConfig(),
        userMessage: 'Kon configuratie niet laden, gebruik standaard instellingen'
      },
      PROGRESS_SAVING: {
        fallback: () => true,
        userMessage: 'Kon voortgang niet opslaan, probeer het later opnieuw'
      },
      PROGRESS_LOADING: {
        fallback: () => null,
        userMessage: 'Kon opgeslagen voortgang niet laden'
      },
      SECURITY_VALIDATION: {
        fallback: () => false,
        userMessage: 'Beveiligingscontrole mislukt'
      },
      WEB3_CONNECTION: {
        fallback: () => false,
        userMessage: 'Kon geen verbinding maken met wallet'
      },
      CONTRACT_INTERACTION: {
        fallback: () => null,
        userMessage: 'Blockchain transactie mislukt'
      },
      THREE_JS_ERROR: {
        fallback: () => null,
        userMessage: '3D rendering fout opgetreden'
      },
      ASSET_LOADING: {
        fallback: () => null,
        userMessage: 'Kon bestand niet laden'
      }
    };
  }

  // Hoofdfunctie voor error handling
  handle(error, context, errorType = 'GENERAL') {
    if (!this.isEnabled) {
      console.error(`Error in ${context}:`, error);
      return null;
    }

    // Increment error count
    this.errorCount++;
    
    // Log error
    this.logError(error, context, errorType);
    
    // Check voor te veel errors
    if (this.errorCount > this.maxErrors) {
      this.handleMaxErrorsReached();
      return null;
    }
    
    // Get error type config
    const errorConfig = this.errorTypes[errorType] || this.errorTypes.GENERAL;
    
    // Show user message
    this.showUserMessage(errorConfig.userMessage, 'error');
    
    // Return fallback value
    return typeof errorConfig.fallback === 'function' 
      ? errorConfig.fallback() 
      : errorConfig.fallback;
  }

  // Async error handling
  async handleAsync(error, context, errorType = 'GENERAL') {
    const result = this.handle(error, context, errorType);
    return Promise.resolve(result);
  }

  // Log error met context
  logError(error, context, errorType) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context: context,
      type: errorType,
      message: error.message || error.toString(),
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Console logging
    console.error(`❌ Error in ${context}:`, error);
    console.error(`📊 Error Info:`, errorInfo);
    
    // Store in history
    this.errorHistory.push(errorInfo);
    
    // Keep history manageable
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }
    
    // Send to monitoring service (if available)
    this.sendToMonitoring(errorInfo);
  }

  // Show user-friendly message
  showUserMessage(message, type = 'error') {
    // Remove existing messages
    document.querySelectorAll('.error-message').forEach(msg => msg.remove());
    
    const messageEl = document.createElement('div');
    messageEl.className = 'error-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : '#4CAF50'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation CSS
    if (!document.getElementById('error-animations')) {
      const style = document.createElement('style');
      style.id = 'error-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => messageEl.remove(), 300);
      }
    }, 5000);
  }

  // Handle max errors reached
  handleMaxErrorsReached() {
    console.error('🚨 Maximum aantal errors bereikt! Resetting error handler...');
    this.showUserMessage('Te veel fouten opgetreden. Pagina wordt herladen...', 'error');
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  // Send error to monitoring service
  sendToMonitoring(errorInfo) {
    // Hier kun je error tracking services integreren
    // Bijvoorbeeld: Sentry, LogRocket, etc.
    
    if (window.gtag) {
      // Google Analytics error tracking
      window.gtag('event', 'exception', {
        description: errorInfo.message,
        fatal: false
      });
    }
  }

  // Get default config fallback
  getDefaultConfig() {
    return {
      level: 'beginner',
      shape: 'piramide',
      sterren: { totaal: 4000, wit: 4000 },
      planeten: { rood: 1000, groen: 1000 },
      sollys: { geel: 1750, blauw: 1750, pink: 0, rood: 1500 }
    };
  }

  // Validate data met error handling
  validateData(data, schema, context) {
    try {
      if (!data) {
        throw new Error('Data is null or undefined');
      }
      
      // Basic schema validation
      for (const [key, type] of Object.entries(schema)) {
        if (!(key in data)) {
          throw new Error(`Missing required field: ${key}`);
        }
        
        if (typeof data[key] !== type) {
          throw new Error(`Invalid type for ${key}: expected ${type}, got ${typeof data[key]}`);
        }
      }
      
      return true;
    } catch (error) {
      this.handle(error, context, 'DATA_VALIDATION');
      return false;
    }
  }

  // Safe function execution
  safeExecute(fn, context, fallback = null) {
    try {
      return fn();
    } catch (error) {
      return this.handle(error, context, 'FUNCTION_EXECUTION') || fallback;
    }
  }

  // Safe async function execution
  async safeExecuteAsync(fn, context, fallback = null) {
    try {
      return await fn();
    } catch (error) {
      return await this.handleAsync(error, context, 'ASYNC_FUNCTION_EXECUTION') || fallback;
    }
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorHistory.length,
      isEnabled: this.isEnabled,
      maxErrors: this.maxErrors
    };
  }

  // Reset error handler
  reset() {
    this.errorCount = 0;
    this.errorHistory = [];
    console.log('✅ Error handler reset');
  }

  // Enable/disable error handling
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔧 Error handling ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Cleanup
  cleanup() {
    // Remove all error messages
    document.querySelectorAll('.error-message').forEach(msg => msg.remove());
    
    // Remove animation styles
    const style = document.getElementById('error-animations');
    if (style) {
      style.remove();
    }
  }
}

// Maak globaal beschikbaar
window.ErrorHandler = ErrorHandler;
window.errorHandler = new ErrorHandler();

// Global error handler voor uncaught errors
window.addEventListener('error', (event) => {
  window.errorHandler.handle(event.error, 'UNCAUGHT_ERROR', 'GENERAL');
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  window.errorHandler.handle(event.reason, 'UNHANDLED_PROMISE_REJECTION', 'GENERAL');
}); 