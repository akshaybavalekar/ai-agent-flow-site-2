import { motion } from "framer-motion";

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  matchScore?: number;
  fitCategory?: string;
}

interface CardStackProps {
  jobs?: Job[];
}

/**
 * Card stack template for displaying job matches.
 * Shows job cards in a swipeable stack format.
 */
export function CardStack({
  jobs = []
}: CardStackProps) {
  // Mock jobs if none provided
  const displayJobs = jobs.length > 0 ? jobs : [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "Tech Corp",
      location: "Remote",
      matchScore: 92,
      fitCategory: "good-fit"
    },
    {
      id: "2", 
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      matchScore: 85,
      fitCategory: "good-fit"
    },
    {
      id: "3",
      title: "Frontend Engineer",
      company: "Design Co",
      location: "New York, NY",
      matchScore: 78,
      fitCategory: "stretch"
    }
  ];

  const getFitColor = (fitCategory?: string) => {
    switch (fitCategory) {
      case 'good-fit': return 'text-green-400';
      case 'stretch': return 'text-yellow-400';
      case 'grow-into': return 'text-blue-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          Your Job Matches
        </h2>
        
        <div className="relative">
          {displayJobs.slice(0, 3).map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: index * -8, 
                scale: 1 - (index * 0.02),
                zIndex: displayJobs.length - index
              }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`
                absolute inset-x-0 bg-white/10 backdrop-blur-sm border border-white/20 
                rounded-2xl p-6 cursor-pointer transition-all duration-200
                hover:bg-white/15 hover:border-white/30
                ${index > 0 ? 'pointer-events-none' : ''}
              `}
              style={{
                top: index * 8,
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1">
                    {job.title}
                  </h3>
                  <p className="text-white/70 font-medium">
                    {job.company}
                  </p>
                  {job.location && (
                    <p className="text-white/50 text-sm mt-1">
                      {job.location}
                    </p>
                  )}
                </div>
                
                {job.matchScore && (
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getFitColor(job.fitCategory)}`}>
                      {job.matchScore}%
                    </div>
                    <div className="text-xs text-white/50 uppercase tracking-wide">
                      Match
                    </div>
                  </div>
                )}
              </div>
              
              {job.fitCategory && (
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getFitColor(job.fitCategory)} bg-current/10`}>
                  {job.fitCategory.replace('-', ' ')}
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Spacer for stacked cards */}
        <div style={{ height: (displayJobs.length - 1) * 8 + 200 }} />
        
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Tap a card to view details
          </p>
        </div>
      </motion.div>
    </div>
  );
}