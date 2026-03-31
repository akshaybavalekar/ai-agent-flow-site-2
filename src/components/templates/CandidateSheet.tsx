import { motion } from "framer-motion";

interface CandidateSheetProps {
  candidateId?: string;
  name?: string;
  title?: string;
  avatarUrl?: string;
}

/**
 * Candidate review sheet template.
 * Shows candidate information for review before proceeding.
 */
export function CandidateSheet({
  candidateId,
  name = "Your Profile",
  title,
  avatarUrl
}: CandidateSheetProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-3xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <h2 className="text-2xl font-semibold text-white mb-2">
            {name}
          </h2>
          
          {title && (
            <p className="text-white/70 font-medium mb-6">
              {title}
            </p>
          )}

          <div className="space-y-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4 text-left">
              <h3 className="font-medium text-white mb-2">Profile Status</h3>
              <p className="text-white/70 text-sm">
                Ready for job matching
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-left">
              <h3 className="font-medium text-white mb-2">Next Steps</h3>
              <p className="text-white/70 text-sm">
                We'll find personalized job matches based on your profile
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-white/20 hover:bg-white/25 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Looks Good
            </button>
            
            <button className="w-full bg-white/10 hover:bg-white/15 text-white/80 font-medium py-3 px-6 rounded-lg transition-colors">
              Edit Profile
            </button>
          </div>
          
          {candidateId && (
            <p className="text-white/40 text-xs mt-4">
              ID: {candidateId}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}