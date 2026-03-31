import { motion } from "framer-motion";

interface LoadingLinkedInProps {
  message?: string;
}

/**
 * LinkedIn-specific loading template.
 */
export function LoadingLinkedIn({
  message = "Connecting with LinkedIn..."
}: LoadingLinkedInProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        {/* LinkedIn-style loading animation */}
        <div className="mb-6">
          <motion.div
            className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </motion.div>
        </div>
        
        <p className="text-white/80 font-medium text-lg mb-2">
          {message}
        </p>
        
        <p className="text-white/50 text-sm">
          This may take a moment...
        </p>
      </motion.div>
    </div>
  );
}