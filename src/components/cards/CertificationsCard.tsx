import React from 'react';
import { Award, Calendar, Clock, CheckCircle } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
    active:   { color: '#22c55e', label: 'Active' },
    expiring: { color: '#f59e0b', label: 'Expiring' },
    expired:  { color: '#ff4040', label: 'Expired' },
};

interface Certification {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    status?: 'active' | 'expiring' | 'expired';
}

interface CertificationsCardProps {
    title?: string;
    certifications: Certification[];
}

export const CertificationsCard: React.FC<CertificationsCardProps> = ({ title, certifications = [] }) => {
    const { visible, overflow } = clampList(certifications, 4);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-2">
            {/* Header */}
            <div className="flex items-center gap-2 shrink-0">
                <Award size={14} style={{ color: '#f59e0b' }} />
                <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
                    {title ?? 'Certifications'}
                </h3>
                <span className="font-data text-base ml-auto" style={{ color: getColor(55) }}>{certifications.length} creds</span>
            </div>

            {/* List */}
            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
                {visible.map((cert, i) => {
                    const st = STATUS_STYLE[cert.status ?? 'active'];
                    return (
                        <div key={i} className="flex items-start gap-2 px-2 py-2 rounded"
                            style={{ backgroundColor: getColor(5), border: `1px solid ${getColor(12)}` }}>
                            <div className="shrink-0 p-1.5 rounded"
                                style={{ backgroundColor: getColor(10) }}>
                                <Award size={14} style={{ color: C }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                    <span className="font-data text-base font-bold leading-tight truncate" style={{ color: getColor(90) }}>{cert.name}</span>
                                    <span className="font-data text-xs px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
                                        style={{ backgroundColor: `${st.color}18`, color: st.color }}>{st.label}</span>
                                </div>
                                <div className="font-voice text-base mt-0.5" style={{ color: getColor(65) }}>{cert.issuer}</div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={10} style={{ color: getColor(50) }} />
                                        <span className="font-data text-xs" style={{ color: getColor(55) }}>{cert.issueDate}</span>
                                    </div>
                                    {cert.expiryDate && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} style={{ color: getColor(50) }} />
                                            <span className="font-data text-xs" style={{ color: getColor(55) }}>exp. {cert.expiryDate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <OverflowPill count={overflow} label="more certifications" />
        </div>
    );
};

export default CertificationsCard;
