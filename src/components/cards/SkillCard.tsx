import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

interface SkillItem {
  name: string;
  currentLevel: number;
  targetLevel: number;
  evidence?: string;
}

interface SkillCardProps {
  title?: string;
  skills: SkillItem[];
  showEvidence?: boolean;
  subtitle?: string;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  title,
  skills,
  showEvidence = false,
  subtitle
}) => {
  const MAX_DOTS = 10;

  return (
    <div className="flex flex-col h-full justify-start gap-3">
      {title && (
        <div className="flex gap-2 items-center">
          <Star size={16} style={{ color: C }} />
          <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
            {title}
          </h3>
        </div>
      )}

      <div className="flex flex-col gap-3 flex-1">
        {skills.map((skill, index) => {
          const filled = skill.currentLevel * 2; // Convert 1-5 to 2-10 dots
          const target = (skill.targetLevel - skill.currentLevel) * 2;
          const empty = MAX_DOTS - filled - target;

          return (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-voice text-sm flex-1 min-w-0 truncate pr-3" style={{ color: getColor(80) }}>
                  {skill.name}
                </span>
                <div className="flex gap-1 items-center shrink-0">
                  <div className="flex gap-0.5 items-center">
                    {Array.from({ length: filled }, (_, i) => (
                      <div
                        key={`f-${i}`}
                        className="w-1.5 h-4 rounded-full"
                        style={{ backgroundColor: C }}
                      />
                    ))}
                    {Array.from({ length: target }, (_, i) => (
                      <div
                        key={`t-${i}`}
                        className="w-1.5 h-4 rounded-full border"
                        style={{ 
                          backgroundColor: getColor(15),
                          borderColor: C
                        }}
                      />
                    ))}
                    {Array.from({ length: empty }, (_, i) => (
                      <div
                        key={`e-${i}`}
                        className="w-1.5 h-4 rounded-full"
                        style={{ backgroundColor: getColor(10) }}
                      />
                    ))}
                  </div>
                  <span className="font-data text-xs font-semibold text-center w-4 ml-1" style={{ color: getColor(70) }}>
                    {skill.currentLevel}
                  </span>
                </div>
              </div>
              
              {showEvidence && skill.evidence && (
                <div className="flex items-start gap-1.5 ml-2">
                  <TrendingUp size={12} className="shrink-0 mt-0.5" style={{ color: getColor(60) }} />
                  <span className="font-voice text-xs leading-relaxed" style={{ color: getColor(60) }}>
                    {skill.evidence}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {subtitle && (
        <p className="font-voice text-sm leading-relaxed" style={{ color: getColor(70) }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SkillCard;