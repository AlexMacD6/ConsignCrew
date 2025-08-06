/**
 * Console Filter Utility
 * Filters out non-critical console errors and warnings to reduce noise
 * Specifically handles content script errors and DALL-E image errors
 */

interface ConsoleFilterOptions {
  enableFiltering?: boolean;
  logFilteredErrors?: boolean;
}

class ConsoleFilter {
  private originalConsole: {
    error: typeof console.error;
    warn: typeof console.warn;
    log: typeof console.log;
  };
  private options: ConsoleFilterOptions;

  constructor(options: ConsoleFilterOptions = {}) {
    this.options = {
      enableFiltering: true,
      logFilteredErrors: false,
      ...options,
    };

    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
    };

    if (this.options.enableFiltering) {
      this.setupFiltering();
    }
  }

  private setupFiltering() {
    // Filter console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Check if this error should be filtered
      if (this.shouldFilterError(message)) {
        if (this.options.logFilteredErrors) {
          this.originalConsole.log('Filtered error:', message);
        }
        return;
      }
      
      this.originalConsole.error(...args);
    };

    // Filter console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Check if this warning should be filtered
      if (this.shouldFilterWarning(message)) {
        if (this.options.logFilteredErrors) {
          this.originalConsole.log('Filtered warning:', message);
        }
        return;
      }
      
      this.originalConsole.warn(...args);
    };
  }

  private shouldFilterError(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Filter content script errors
    if (lowerMessage.includes('content.js') || 
        lowerMessage.includes('getjsonld') ||
        lowerMessage.includes('cannot read properties of null')) {
      return true;
    }

    // Filter DALL-E image authentication errors
    if (lowerMessage.includes('403') && 
        (lowerMessage.includes('oaidalleapiprodscus') || 
         lowerMessage.includes('blob.core.windows.net'))) {
      return true;
    }

    // Filter Meta Conversion API errors (but log them for debugging)
    if (lowerMessage.includes('meta/conversion') && lowerMessage.includes('500')) {
      // Don't filter these - they're important for debugging
      return false;
    }

    // Filter common browser extension errors
    if (lowerMessage.includes('extension') || 
        lowerMessage.includes('chrome-extension') ||
        lowerMessage.includes('moz-extension')) {
      return true;
    }

    // Filter common React development warnings
    if (lowerMessage.includes('react does not recognize') ||
        lowerMessage.includes('invalid dom property') ||
        lowerMessage.includes('unknown event handler')) {
      return true;
    }

    return false;
  }

  private shouldFilterWarning(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Filter content script warnings
    if (lowerMessage.includes('content.js')) {
      return true;
    }

    // Filter common browser warnings
    if (lowerMessage.includes('deprecated') ||
        lowerMessage.includes('experimental') ||
        lowerMessage.includes('non-standard')) {
      return true;
    }

    return false;
  }

  public restore() {
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.log = this.originalConsole.log;
  }

  public enable() {
    this.options.enableFiltering = true;
    this.setupFiltering();
  }

  public disable() {
    this.options.enableFiltering = false;
    this.restore();
  }
}

// Only create and export on client side
let consoleFilter: ConsoleFilter | null = null;

if (typeof window !== 'undefined') {
  consoleFilter = new ConsoleFilter({
    enableFiltering: true,
    logFilteredErrors: false,
  });

  // Auto-enable filtering in development
  if (process.env.NODE_ENV === 'development') {
    consoleFilter.enable();
  }
}

export { consoleFilter };
export default ConsoleFilter; 