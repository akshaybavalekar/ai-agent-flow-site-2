'use client';

import { GridView } from '@/components/cards/GridView';

export default function TestPage() {
  const testCards = [
    // Original migrated cards
    {
      type: 'avatar-prompt',
      question: 'Welcome to the fully migrated UI system!',
      showProgress: true,
      progressStep: 3,
      progressTotal: 4
    },
    {
      type: 'circular-gauge',
      title: 'Performance',
      percentage: 85,
      subtitle: 'System running well'
    },
    {
      type: 'progress-bar',
      title: 'Migration Progress',
      label: 'Components',
      percent: 95,
      subtitle: 'Migration nearly complete'
    },
    
    // New chart cards
    {
      type: 'path-track',
      title: 'Career Path',
      label: 'Software Engineer Track',
      percentage: 65,
      fromLabel: 'Junior',
      toLabel: 'Senior',
      subtitle: 'On track for promotion'
    },
    {
      type: 'trend-line',
      title: 'Performance Trend',
      data: [
        { month: 'Jan', score: 75 },
        { month: 'Feb', score: 78 },
        { month: 'Mar', score: 82 },
        { month: 'Apr', score: 85 },
        { month: 'May', score: 88 },
        { month: 'Jun', score: 90 }
      ],
      showLabels: true,
      subtitle: 'Steady improvement over 6 months'
    },
    
    // Job and learning cards
    {
      type: 'job-card',
      title: 'Featured Opportunity',
      jobTitle: 'Senior Full Stack Developer',
      company: 'TechCorp',
      location: 'Remote',
      salaryRange: '$120K - $150K',
      matchScore: 92,
      aiSummary: 'Excellent match for your skills. This role offers growth opportunities in modern tech stack with a strong engineering culture.',
      saved: true
    },
    {
      type: 'learning-card',
      title: 'Recommended Learning',
      courseTitle: 'Advanced React Patterns',
      currentLevel: 3,
      targetLevel: 5,
      levelLabel: 'Intermediate → Expert',
      courseType: 'video',
      progress: 65,
      duration: '12 hours'
    },
    
    // Container cards with items
    {
      type: 'dot-plot',
      title: 'Technical Skills',
      items: [
        { label: 'JavaScript', filled: 8, target: 2, value: 4 },
        { label: 'TypeScript', filled: 6, target: 4, value: 3 },
        { label: 'React', filled: 10, target: 0, value: 5 },
        { label: 'Node.js', filled: 6, target: 2, value: 3 },
        { label: 'Python', filled: 4, target: 4, value: 2 }
      ],
      subtitle: 'Current skill levels and growth targets'
    },
    {
      type: 'skill-card',
      title: 'Core Competencies',
      showEvidence: true,
      skills: [
        { name: 'Frontend Development', currentLevel: 5, targetLevel: 5, evidence: 'Led 3 major React projects' },
        { name: 'Backend APIs', currentLevel: 4, targetLevel: 5, evidence: 'Built scalable Node.js services' },
        { name: 'System Design', currentLevel: 3, targetLevel: 4, evidence: 'Designed microservice architecture' },
        { name: 'Team Leadership', currentLevel: 2, targetLevel: 4, evidence: 'Mentoring junior developers' }
      ],
      subtitle: 'Skills assessment with evidence'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">UI Migration Test</h1>
          <p className="text-white/60">Testing all migrated components in the scene system</p>
        </div>
        
        <GridView 
          badge="MIGRATION COMPLETE"
          layout="3x4"
          cards={testCards}
          maxRows={4}
        />
      </div>
    </div>
  );
}