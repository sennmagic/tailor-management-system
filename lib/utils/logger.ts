// Production-safe logging utility
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
  
  // API request logging (only in development)
  apiRequest: (url: string, method: string, data?: any) => {
    if (!isProduction) {
      console.log('🌐 API Request:', { url, method, data });
    }
  },
  
  // API response logging (only in development)
  apiResponse: (url: string, status: number, data?: any) => {
    if (!isProduction) {
      console.log('🌐 API Response:', { url, status, data });
    }
  },
  
  // API error logging (always log errors)
  apiError: (url: string, error: any) => {
    console.error('🌐 API Error:', { url, error });
  }
};
