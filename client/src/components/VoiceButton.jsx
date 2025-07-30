import { useState, useRef, useEffect } from 'react';

export default function VoiceButton({ onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const isActiveRef = useRef(false);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Cleanup error (normal):', e);
      }
      recognitionRef.current = null;
    }
    
    isActiveRef.current = false;
    setIsListening(false);
    setIsProcessing(false);
  };

  const handleVoice = async () => {
    // If already listening, stop
    if (isListening || isProcessing) {
      console.log('Stopping voice recognition...');
      cleanup();
      return;
    }

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    // Check HTTPS (required for microphone access)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      alert('Voice recognition requires HTTPS. Please use a secure connection.');
      return;
    }

    console.log('Starting voice recognition...');
    
    try {
      // Create new recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      isActiveRef.current = true;

      // Configure recognition
      recognition.lang = 'en-US';
      recognition.continuous = false; // Single recognition session
      recognition.interimResults = false; // Only final results
      recognition.maxAlternatives = 1;
      
      // Set timeout to prevent infinite listening
      timeoutRef.current = setTimeout(() => {
        console.log('Recognition timeout - stopping...');
        cleanup();
      }, 10000); // 10 second max listening time

      // Handle successful recognition
      recognition.onresult = (event) => {
        console.log('Recognition result received');
        
        if (!isActiveRef.current) return;
        
        try {
          const transcript = event.results[0][0].transcript.trim();
          console.log('Transcript:', transcript);
          
          if (transcript) {
            setIsProcessing(true);
            setIsListening(false);
            
            // Send result to parent
            onResult(transcript);
            
            // Small delay to show processing state
            setTimeout(() => {
              cleanup();
            }, 500);
          } else {
            console.log('Empty transcript received');
            cleanup();
          }
        } catch (error) {
          console.error('Error processing result:', error);
          cleanup();
        }
      };

      // Handle recognition start
      recognition.onstart = () => {
        console.log('Recognition started successfully');
        if (isActiveRef.current) {
          setIsListening(true);
          setIsProcessing(false);
        }
      };

      // Handle recognition end
      recognition.onend = () => {
        console.log('Recognition ended');
        
        // Only cleanup if we haven't already processed a result
        if (isActiveRef.current && !isProcessing) {
          setTimeout(() => {
            cleanup();
          }, 100);
        }
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        
        if (!isActiveRef.current) return;
        
        let errorMessage = '';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found or not working.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech service not allowed. Please try again.';
            break;
          default:
            errorMessage = `Recognition error: ${event.error}`;
        }
        
        alert(errorMessage);
        cleanup();
      };

      // Start recognition
      setIsProcessing(true);
      recognition.start();
      
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      alert('Failed to start voice recognition. Please try again.');
      cleanup();
    }
  };

  const getButtonText = () => {
    if (isProcessing && !isListening) {
      return '⏳ Processing...';
    } else if (isListening) {
      return '🎤 Listening...';
    } else {
      return '🎙️ Speak';
    }
  };

  const getButtonColor = () => {
    if (isProcessing && !isListening) {
      return '#FF9800'; // Orange for processing
    } else if (isListening) {
      return '#4CAF50'; // Green for listening
    } else {
      return '#2196F3'; // Blue for ready
    }
  };

  return (
    <button
      onClick={handleVoice}
      disabled={false}
      className="p-2 bg-blue-500 text-white rounded ml-2 hover:bg-blue-600 transition-all duration-200"
      style={{
        backgroundColor: getButtonColor(),
        color: 'white',
        opacity: (isListening || isProcessing) ? 0.8 : 1,
        cursor: 'pointer'
      }}
      title={isListening ? 'Click to stop listening' : 'Click to start voice input'}
    >
      {getButtonText()}
    </button>
  );
}