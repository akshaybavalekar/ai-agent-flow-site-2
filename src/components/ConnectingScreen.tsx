import { motion } from "framer-motion";

export function ConnectingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black"
    >
      <div className="flex flex-col items-center gap-8">
        {/* trAIn Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            tr<span className="text-green-400">AI</span>n
          </h1>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-green-400"
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
        
        {/* Connecting text */}
        <p className="text-white/80 font-medium text-lg">
          Connecting...
        </p>
      </div>
    </motion.div>
  );
}