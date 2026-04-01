import React from 'react';
import { Target, Award } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

function scoreConfig(score: number): { color: string; label: string } {
    if (score >= 80) return { color: C,         label: 'Expert' };
    if (score >= 60) return { color: '#38bdf8',  label: 'Proficient' };
    if (score >= 40) return { color: '#f59e0b',  label: 'Developing' };
    return               { color: '#ff4040',   label: 'Beginner' };
}

interface AssessedSkill {
    name: string;
    score: number;
    category?: string;
    lastAssessed?: string;
}

interface SkillsAssessmentCardProps {
    title?: string;
    skills: AssessedSkill[];
}

export const SkillsAssessmentCard: React.FC<SkillsAssessmentCardProps> = ({ title, skills = [] }) => {
    const { visible, overflow } = clampList(skills, 5);
    const overallScore = skills.length > 0
        ? Math.round(skills.reduce((s, k) => s + k.score, 0) / skills.length)
        : 0;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: C }} />
                    <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
                        {title ?? 'Skills Assessment'}
                    </h3>
                </div>
                {skills.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Award size={14} style={{ color: C }} />
                        <span className="font-data text-base font-bold" style={{ color: C }}>{overallScore}%</span>
                        <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(55) }}>overall</span>
                    </div>
                )}
            </div>

            {/* Skills */}
            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
                {visible.map((skill, i) => {
                    const cfg = scoreConfig(skill.score);
                    return (
                        <div key={i} className="px-2 py-2 rounded"
                            style={{ backgroundColor: getColor(5), border: `1px solid ${getColor(12)}` }}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-data text-base" style={{ color: getColor(88) }}>{skill.name}</span>
                                    <span className="font-data text-xs px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                                        style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}>{cfg.label}</span>
                                </div>
                                <span className="font-data text-base font-bold" style={{ color: cfg.color }}>{skill.score}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(12) }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${skill.score}%`, backgroundColor: cfg.color }} />
                            </div>
                            {skill.lastAssessed && (
                                <div className="font-data text-xs mt-1" style={{ color: getColor(45) }}>
                                    Last assessed: {skill.lastAssessed}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <OverflowPill count={overflow} label="more skills" />
        </div>
    );
};

export default SkillsAssessmentCard;
