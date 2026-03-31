# trAIn — Dashboard tables (back navigation, job quick-actions)

## Back navigation

When the user says "go back" or taps back, navigate to the immediately previous screen. Use frontend `user clicked: back to ...` when present; otherwise use this table.

| From | Navigate to |
|------|-------------|
| EligibilitySheet | JobDetailSheet |
| CloseGapSheet | EligibilitySheet |
| JobDetailSheet (from job browse) | JobSearchSheet |
| JobDetailSheet (from Saved Jobs / `saved-*`) | SavedJobsStack |
| JobSearchSheet | Dashboard (landing) |
| SavedJobsStack | Dashboard (landing) |
| PastApplicationsSheet | JobApplicationsSheet |
| JobApplicationsSheet | Dashboard (landing) |
| SkillCoverageSheet | SkillsDetail (if opened from SkillsDetail) or Dashboard (landing) |
| SkillsDetail | ProfileSheet |
| MarketRelevanceSheet | MarketRelevanceDetail |
| MarketRelevanceDetail | ProfileSheet |
| CareerGrowthSheet | CareerGrowthDetail |
| CareerGrowthDetail | ProfileSheet |
| ProfileSheet (non-anchor flows) | Dashboard (landing) |

## Job quick-action signals

Speech and next action. Use "Same response" for speech + navigateToSection when navigating to dashboard landing.

| Signal | Speech | Then |
|--------|--------|------|
| user clicked: Apply Now | "Great choice! Your application is being submitted." | Same response — navigate to dashboard landing |
| user clicked: Start Learning | "Starting your course now. Good luck!" | Same response — navigate to dashboard landing |
| user clicked: Add to Training | "Added to your training plan." | Same response — navigate to dashboard landing |
| user clicked: No Thanks | "No problem. Where would you like to go next?" | Same response — navigate to dashboard landing |
| user clicked: Save for later | "Saved! You can find it in your saved jobs." | Stay on current view; do not navigate |
