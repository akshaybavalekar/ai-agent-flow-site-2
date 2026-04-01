import React from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

function levelLabel(level: number): { label: string; color: string } {
    if (level >= 90) return { label: 'Expert',        color: C };
    if (level >= 70) return { label: 'Advanced',      color: getColor(80) };
    if (level >= 40) return { label: 'Intermediate',  color: getColor(60) };
    return               { label: 'Beginner',       color: getColor(40) };
}

interface Skill {
    name: string;
    level: number;
    category?: string;
    verified?: boolean;
}

interface SkillsProfileCardProps {
    title?: string;
    skills: Skill[];
    groupByCategory?: boolean;
}

export const SkillsProfileCard: React.FC<SkillsProfileCardProps> = ({
    title,
    skills = [],
    groupByCategory = false,
}) => {
    const { visible, overflow } = clampList(skills, 6);

    const grouped = groupByCategory
        ? visible.reduce((acc, s) => {
            const cat = s.category ?? 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {} as Record<string, Skill[]>)
        : { All: visible };

    return (
        <div className="flex flex-col h-full overflow-hidden gap-2">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: C }} />
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                    {!title && <span className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>Skills</span>}
                </div>
                <span className="font-data text-base" style={{ color: getColor(55) }}>{skills.length} skills</span>
            </div>

            {/* Skills */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                {Object.entries(grouped).map(([cat, catSkills]) => (
                    <div key={cat}>
                        {groupByCategory && Object.keys(grouped).length > 1 && (
                            <div className="font-data text-xs uppercase tracking-wider mb-1.5 pl-1"
                                style={{ color: getColor(55), borderLeft: `2px solid ${C}`, paddingLeft: 6 }}>
                                {cat}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            {catSkills.map((skill, i) => {
                                const lv = levelLabel(skill.level);
                                return (
                                    <div key={i} className="px-2 py-1.5 rounded"
                                        style={{ backgroundColor: getColor(5), border: `1px solid ${getColor(12)}` }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-data text-base leading-tight" style={{ color: getColor(88) }}>{skill.name}</span>
                                                {skill.verified && <CheckCircle size={11} style={{ color: '#22c55e' }} />}
                                            </div>
                                            <span className="font-data text-xs uppercase tracking-wider" style={{ color: lv.color }}>{lv.label}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(12) }}>
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${skill.level}%`, backgroundColor: C }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <OverflowPill count={overflow} label="more skills" />
        </div>
    );
};

export default SkillsProfileCard;
