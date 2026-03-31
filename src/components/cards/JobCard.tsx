import React from 'react';
import { MapPin, Bookmark, TrendingUp } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

const SalaryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path
      d="M12 3v18M16.5 6.5H9.75a3 3 0 0 0 0 6h4.5a3 3 0 0 1 0 6H7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface JobCardProps {
  title?: string;
  jobTitle: string;
  company: string;
  location: string;
  salaryRange: string;
  matchScore: number;
  aiSummary: string;
  aiGapInsight?: string;
  saved?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  title,
  jobTitle,
  company,
  location,
  salaryRange,
  matchScore,
  aiSummary,
  aiGapInsight,
  saved = false
}) => {
  // Determine fit category based on score
  const fitCategory = matchScore >= 80 ? 'good-fit' : matchScore >= 60 ? 'stretch' : 'grow';
  const fitColor = matchScore >= 80 ? C : matchScore >= 60 ? '#51a2ff' : '#a78bfa';

  return (
    <div className="flex flex-col h-full justify-start gap-3 p-1">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}

      {/* Header: Company initial + Job title/company + Fit score */}
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: getColor(15) }}>
          <span className="text-xs font-bold" style={{ color: getColor(90) }}>
            {company.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-voice text-base font-bold leading-tight truncate" style={{ color: getColor(90) }}>
            {jobTitle}
          </p>
          <p className="font-voice text-sm" style={{ color: getColor(70) }}>
            {company}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="font-data text-xs tracking-wider" style={{ color: getColor(60) }}>
            FIT
          </span>
          <div className="relative flex items-center justify-center size-8">
            <svg width="32" height="32" className="absolute inset-0 -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke={getColor(20)}
                strokeWidth="3"
              />
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke={fitColor}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 12}`}
                strokeDashoffset={`${2 * Math.PI * 12 * (1 - matchScore / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="font-data text-xs font-bold" style={{ color: getColor(90) }}>
              {matchScore}
            </span>
          </div>
        </div>
      </div>

      {/* Salary and Location */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <SalaryIcon />
          <span className="font-voice text-sm" style={{ color: getColor(80) }}>
            {salaryRange}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={20} className="shrink-0" style={{ color: getColor(70) }} />
          <span className="font-voice text-sm" style={{ color: getColor(80) }}>
            {location}
          </span>
        </div>
      </div>

      {/* Gap insight for stretch/grow roles */}
      {aiGapInsight && fitCategory !== "good-fit" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: getColor(8),
            border: `1px solid ${getColor(20)}`,
          }}
        >
          <TrendingUp size={14} className="shrink-0 mt-0.5" style={{ color: fitColor }} />
          <span className="font-voice text-xs leading-relaxed" style={{ color: getColor(80) }}>
            {aiGapInsight}
          </span>
        </div>
      )}

      {/* AI Summary */}
      <p className="font-voice text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: getColor(80) }}>
        {aiSummary}
      </p>

      {/* Save indicator */}
      <div className="flex items-center justify-end">
        <Bookmark
          size={16}
          strokeWidth={saved ? 0 : 1.5}
          className={saved ? 'fill-current' : ''}
          style={{ color: saved ? C : getColor(50) }}
        />
      </div>
    </div>
  );
};

export default JobCard;