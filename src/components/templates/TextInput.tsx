import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface TextInputProps {
  placeholder?: string;
}

/**
 * Floating text-input pill template.
 * Auto-focuses on mobile and reveals after avatar finishes speaking.
 */
export function TextInput({
  placeholder = "Type here..."
}: TextInputProps) {
  const [value, setValue] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus after a brief delay (simulating speech gate)
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    if (hasSubmitted || !value.trim()) return;
    
    setHasSubmitted(true);
    console.log(`User typed: ${value.trim()}`);
    
    // Auto-dismiss after submit
    setTimeout(() => {
      console.log('TextInput should dismiss now');
    }, 500);
  }, [hasSubmitted, value]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none">
      <div className="w-full max-w-sm px-4 pb-32 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={hasSubmitted}
            className={`
              flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base
              ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          
          <button
            onClick={handleSubmit}
            disabled={hasSubmitted || !value.trim()}
            className={`
              p-2 rounded-full transition-all duration-200
              ${hasSubmitted || !value.trim()
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-white/10 text-white'
              }
            `}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L6.59 1.41L12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z"/>
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  );
}