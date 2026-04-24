# SmartSeason Presentation Guide

## 4-Minute Demo Flow

### 1. Start with the problem

Say:

"This app is for coordinators and field agents who need to know which fields need attention first, not just store field records."

### 2. Open the coordinator dashboard

Show:

- the operations focus banner
- the priority queue
- the at-risk fields

Say:

"Instead of a generic dashboard, I wanted the system to rank fields by urgency and explain why they need attention."

### 3. Open one urgent field

Best options:

- `Mwea Block 7A`
- `Nyeri Highlands Block B`
- `Kisumu Lowland Cassava`

Show:

- summary
- priority badge and score
- reasons list
- recommended next action
- crop benchmark thresholds

Say:

"The key design choice here is explainability. The system does not just say 'at risk' - it gives the operational reason and the next action."

### 4. Show the timeline

Open the update history and explain that the timeline supports the recommendation with real field notes.

Say:

"I wanted the decision layer to stay connected to actual activity in the field, not just abstract status labels."

### 5. Log an update

Add a note or change the stage, then mention that the field state recalculates immediately.

Say:

"The insight is computed from live field data, so the recommendation updates as soon as new observations come in."

## What Makes This Version Unique

Use these points when comparing your project to more generic assessment submissions:

- It is not only a CRUD app. It is a prioritization tool.
- The backend contains crop-aware heuristics instead of one rule for every crop.
- Each field carries explainable reasoning and a next step.
- The seed data tells a believable operations story instead of random records.
- The interface is built around decision-making, not just record management.

## Strong Recruiter Answers

### If they ask "Why did you build it this way?"

Say:

"I wanted to show product thinking, not just implementation. In real operations, the most valuable question is not 'what fields exist?' but 'which field needs attention now, why, and what should the team do next?'"

### If they ask "What would you improve next?"

Say:

"I would add real agronomy configuration per crop and region, photo attachments for updates, and eventually a scheduling layer for assigning visits automatically."

### If they ask "Did you use AI?"

Say:

"Yes, I used AI as a development accelerator, but the architecture, business rules, prioritization model, UX decisions, debugging, and final implementation choices are mine. I can explain the tradeoffs in the risk logic and why I designed the workflow this way."

That answer is strong because it is honest and still shows ownership.

## Best Demo Fields

- `Mwea Block 7A`: ready maize, harvest logistics delay, immediate priority
- `Nyeri Highlands Block B`: ready sunflower, overdue action
- `Kisumu Lowland Cassava`: stale monitoring plus overdue crop cycle
- `Naivasha Trial Bed`: newly planted but unassigned, which shows operational risk beyond crop health

## Final Presentation Tip

Do not try to present every feature. Spend most of your time on one field and show that you understand the logic deeply. Recruiters usually remember clarity and ownership more than feature count.
