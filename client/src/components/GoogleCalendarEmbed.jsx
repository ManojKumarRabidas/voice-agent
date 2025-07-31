import React, { useState, useEffect } from 'react';

const GoogleCalendarEmbed = ({ calendarId, doctorName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Construct the public embed URL with all necessary parameters
  const embedUrl = new URL('https://calendar.google.com/calendar/embed');
  embedUrl.searchParams.set('src', calendarId);
  embedUrl.searchParams.set('ctz', 'America/New_York');
  embedUrl.searchParams.set('mode', 'AGENDA'); // Shows agenda view instead of month
  embedUrl.searchParams.set('showTitle', '0'); // Hide calendar title
  embedUrl.searchParams.set('showNav', '1'); // Show navigation
  embedUrl.searchParams.set('showDate', '1'); // Show date
  embedUrl.searchParams.set('showPrint', '0'); // Hide print button
  embedUrl.searchParams.set('showTabs', '0'); // Hide tabs
  embedUrl.searchParams.set('showCalendars', '0'); // Hide calendar list
  embedUrl.searchParams.set('showTz', '0'); // Hide timezone
  embedUrl.searchParams.set('height', '600');
  embedUrl.searchParams.set('wkst', '1'); // Week starts on Sunday
  embedUrl.searchParams.set('bgcolor', '%23ffffff'); // Background color

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    // Reset states when calendarId changes
    setIsLoading(true);
    setHasError(false);
  }, [calendarId]);

  const CalendarError = () => (
    <div className="flex flex-col items-center justify-center h-96 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="text-center space-y-4">
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Calendar Unavailable
          </h3>
          <p className="text-gray-500 mt-1">
            {doctorName}'s calendar cannot be displayed at the moment.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This may be due to privacy settings or network issues.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg 
            className="mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Retry Loading
        </button>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse bg-gray-50 border border-gray-200 rounded-lg h-96">
      <div className="p-4 space-y-4">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 rounded w-16"></div>
        </div>
        
        {/* Calendar content skeleton */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-4 bg-gray-300 rounded w-12"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (hasError) {
    return <CalendarError />;
  }

  return (
    <div className="relative">
      {isLoading && <LoadingSkeleton />}
      
      <iframe
        key={`${calendarId}-${retryCount}`} // Force re-render on retry
        src={embedUrl.toString()}
        className={`w-full h-96 border border-gray-200 rounded-lg shadow-sm ${
          isLoading ? 'absolute opacity-0' : 'opacity-100'
        }`}
        frameBorder="0"
        scrolling="no"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={`${doctorName} Calendar`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        allow="camera 'none'; geolocation 'none'; microphone 'none'"
      />
      
      {/* Security notice */}
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Read-only view • No personal data is collected
      </div>
    </div>
  );
};

export default GoogleCalendarEmbed;