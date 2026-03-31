import { motion } from "framer-motion";

interface LoadingGeneralProps {
  message?: string;
}

/**
 * General loading template with animated dots.
 */
export function LoadingGeneral({
  message = "Loading..."
}: LoadingGeneralProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        {/* Animated dots */}
        <div className="flex gap-2 mb-6 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-white/60"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        
        <p className="text-white/80 font-medium text-lg">
          {message}
        </p>
      </motion.div>
    </div>
  );
}