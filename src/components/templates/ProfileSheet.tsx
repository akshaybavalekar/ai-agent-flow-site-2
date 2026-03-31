import { motion } from "framer-motion";

interface ProfileSheetProps {
  name: string;
  title?: string;
  avatarUrl?: string;
  experience?: any[];
  education?: any[];
  dashboardAnchor?: boolean;
}

/**
 * Profile sheet template showing user information.
 */
export function ProfileSheet({
  name,
  title,
  avatarUrl,
  experience = [],
  education = [],
  dashboardAnchor = false
}: ProfileSheetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-x-0 bottom-0 bg-white/10 backdrop-blur-sm border-t border-white/20 rounded-t-2xl"
      style={{ height: "70vh" }}
    >
      <div className="p-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-2xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {name}
            </h2>
            {title && (
              <p className="text-white/70 font-medium">
                {title}
              </p>
            )}
          </div>
        </div>

        {/* Experience Section */}
        {experience.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Experience
            </h3>
            <div className="space-y-3">
              {experience.slice(0, 3).map((exp: any, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-medium text-white">
                    {exp.title || exp.role || 'Position'}
                  </h4>
                  <p className="text-white/70 text-sm">
                    {exp.company || 'Company'}
                  </p>
                  {exp.duration && (
                    <p className="text-white/50 text-xs mt-1">
                      {exp.duration}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Education
            </h3>
            <div className="space-y-3">
              {education.slice(0, 2).map((edu: any, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-medium text-white">
                    {edu.degree || edu.title || 'Degree'}
                  </h4>
                  <p className="text-white/70 text-sm">
                    {edu.school || edu.institution || 'Institution'}
                  </p>
                  {edu.year && (
                    <p className="text-white/50 text-xs mt-1">
                      {edu.year}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button className="flex-1 bg-white/15 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Edit Profile
          </button>
          <button className="flex-1 bg-white/10 hover:bg-white/15 text-white/80 font-medium py-3 px-4 rounded-lg transition-colors">
            View Skills
          </button>
        </div>
      </div>
    </motion.div>
  );
}