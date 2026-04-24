### 1. The problem


This app is for coordinators and field agents who need to know which fields need attention first, not just store field records.

### 2. Open the coordinator dashboard


- the operations focus banner
- the priority queue
- the at-risk fields


Instead of a generic dashboard, I wanted the system to rank fields by urgency and explain why they need attention.

### 3. Open one urgent field

Best options:

- `Mwea Block 7A`
- `Nyeri Highlands Block B`
- `Kisumu Lowland Cassava`


summary
- priority badge and score
- reasons list
- recommended next action
- crop benchmark thresholds


The key design choice here is explainability. The system does not just say 'at risk' - it gives the operational reason and the next action.

### 4. The timeline

The timeline supports the recommendation with real field notes.


I wanted the decision layer to stay connected to actual activity in the field, not just abstract status labels.

### 5. Log an update

Add a note or change the stage, then you'll see that the field state recalculates immediately.


The insight is computed from live field data, so the recommendation updates as soon as new observations come in.
