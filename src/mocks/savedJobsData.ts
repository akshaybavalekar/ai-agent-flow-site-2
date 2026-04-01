import type { JobListing } from "@/types/flow";

/** Three demo saved jobs for Profile → Saved Jobs (frontend-mocked until API exists). */
export const SAVED_JOBS_MOCK: JobListing[] = [
  {
    id: "saved-1",
    title: "Data Engineer",
    company: "AWS",
    companyLogo:
      "https://logo.clearbit.com/amazon.com",
    location: "Jeddah (remote-friendly)",
    salaryRange: "18,000 – 25,000",
    description:
      "Design and build scalable data pipelines on AWS (Glue, Redshift, S3). Partner with analytics teams to deliver reliable datasets for product and business decisions.",
    fullPostingSummary:
      "In this role, you'll design and deploy AI models and intelligent solutions across AWS's global platform. You'll partner with product and analytics teams to build reliable streaming and batch pipelines, govern data quality, and scale ingestion for high-volume workloads. Expect hands-on work with Glue, Redshift, S3, and modern orchestration—plus clear ownership of how data lands in the hands of decision-makers.",
    matchScore: 93,
    fitCategory: "good-fit",
    aiSummary:
      "Your data engineering background and Python skills align well. This will give you experience with real-time streaming pipelines.",
    dayInLifeVideoEpisode: "EPISODE 6",
    dayInLifeVideoTitle:
      "Recruiters share what every candidate should know. AWS Cloud Support Engineer Careers.",
    dayInLifeVideoDuration: "20:08",
    postedAt: "3 days ago",
    tags: ["AWS", "Data", "Full-time"],
  },
  {
    id: "saved-2",
    title: "Business Intelligence Analyst",
    company: "STC",
    companyLogo:
      "https://logo.clearbit.com/stc.com.sa",
    location: "Riyadh, Saudi Arabia",
    salaryRange: "22,000 – 28,000",
    description:
      "Transform telecom data into dashboards and insights using SQL and modern BI tools to support strategic planning.",
    fullPostingSummary:
      "You'll turn complex telecom and customer data into clear dashboards and narratives for leadership. The role blends SQL modeling, BI tooling (e.g. Power BI / Tableau), and close work with business stakeholders to define KPIs, validate metrics, and ship self-serve reporting that scales across teams.",
    matchScore: 88,
    fitCategory: "good-fit",
    aiSummary:
      "Strong match for your analytical background and stakeholder communication skills. You'll deepen your BI stack while staying close to business impact.",
    dayInLifeVideoEpisode: "EPISODE 3",
    dayInLifeVideoTitle: "A day with the analytics squad",
    dayInLifeVideoDuration: "14:22",
    postedAt: "1 week ago",
    tags: ["Analytics", "Hybrid"],
  },
  {
    id: "saved-3",
    title: "ML Engineer",
    company: "NEOM",
    companyLogo:
      "https://logo.clearbit.com/neom.com",
    location: "NEOM, Saudi Arabia",
    salaryRange: "26,000 – 34,000",
    description:
      "Ship and monitor machine learning models for smart-city initiatives; collaborate with product on MLOps and experimentation.",
    fullPostingSummary:
      "You'll build, deploy, and monitor ML models that power smart-city and sustainability initiatives—from feature stores and training pipelines to production serving and observability. Collaboration with product and data science is constant: you'll own parts of the MLOps story and help raise the bar on experimentation and model quality.",
    matchScore: 76,
    fitCategory: "stretch",
    aiSummary:
      "A stretch role that builds on your data fundamentals toward applied ML and production systems.",
    dayInLifeVideoEpisode: "EPISODE 12",
    dayInLifeVideoTitle: "From notebook to production at scale",
    dayInLifeVideoDuration: "18:41",
    postedAt: "2 weeks ago",
    tags: ["ML", "Python", "On-site"],
  },
];

/** Resolve frontend-mocked saved job for JobDetailSheet when MCP cache has no matching posting. */
export function getSavedJobById(jobId: string | undefined): JobListing | undefined {
  if (!jobId) return undefined;
  return SAVED_JOBS_MOCK.find((j) => j.id === jobId);
}
