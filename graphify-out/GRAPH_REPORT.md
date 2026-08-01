# Graph Report - .  (2026-08-01)

## Corpus Check
- 5 files · ~8,782 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 115 nodes · 197 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Runtime Dependencies
- Committee Data Models
- Build Dependencies
- Realtime Data Reads
- Atomic Cloud Writes
- Deployment and Document
- React Application Flow
- Local Storage Cache
- Audit and Backup UI
- Committee Card UI

## God Nodes (most connected - your core abstractions)
1. `App()` - 17 edges
2. `applyAtomicUpdate()` - 11 edges
3. `createAuditLog()` - 8 edges
4. `upsertCommitteeInCloud()` - 8 edges
5. `moveToTrashBin()` - 8 edges
6. `restoreFromTrashBin()` - 8 edges
7. `objectToList()` - 7 edges
8. `readCommitteeImages()` - 7 edges
9. `replayOfflineOperation()` - 7 edges
10. `TNVR Portal HTML Document` - 6 edges

## Surprising Connections (you probably didn't know these)
- `GitHub Pages Deployment` --conceptually_related_to--> `TNVR Portal HTML Document`  [INFERRED]
  .github/workflows/deploy.yml → index.html
- `App()` --indirect_call--> `loadCommittees()`  [INFERRED]
  src/App.jsx → src/storage.js
- `App()` --calls--> `fetchAllCommitteesWithImages()`  [EXTRACTED]
  src/App.jsx → src/cloudDb.js
- `App()` --calls--> `fetchAuditLogs()`  [EXTRACTED]
  src/App.jsx → src/cloudDb.js
- `App()` --calls--> `moveToTrashBin()`  [EXTRACTED]
  src/App.jsx → src/cloudDb.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **GitHub Pages Build, Artifact, and Deployment Flow** — github_workflows_deploy_node_build, github_workflows_deploy_dist_artifact, github_workflows_deploy_github_pages_deployment [INFERRED 0.95]

## Communities (18 total, 2 thin omitted)

### Community 0 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (17): firebase, lucide-react, dependencies, firebase, lucide-react, react, react-dom, name (+9 more)

### Community 1 - "Committee Data Models"
Cohesion: 0.16
Nodes (10): CommitteeModal(), initialCommittees, months, monthYearOptions, sampleImageOptions, years, firebaseConfig, initializeCloudData() (+2 more)

### Community 2 - "Build Dependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, vite (+7 more)

### Community 3 - "Realtime Data Reads"
Cohesion: 0.33
Nodes (11): db, emitCommittees(), ensureCloudSchema(), fetchAllCommitteesWithImages(), fetchAuditLogs(), fetchCloudCommittees(), getAuditLogTime(), objectToList() (+3 more)

### Community 4 - "Atomic Cloud Writes"
Cohesion: 0.38
Nodes (12): applyAtomicUpdate(), buildCommitteeChanges(), createAuditLog(), enqueueOfflineOperation(), moveToTrashBin(), recordAuditLog(), replayOfflineOperation(), resetCloudDBToDefault() (+4 more)

### Community 5 - "Deployment and Document"
Cohesion: 0.27
Nodes (10): Deploy to GitHub Pages Workflow, dist Pages Artifact, GitHub Pages Deployment, Node.js 20 Build, Arabic RTL Interface, Google Fonts Cairo Typeface, src/main.jsx Module Entry, Application Root Mount (+2 more)

### Community 6 - "React Application Flow"
Cohesion: 0.46
Nodes (6): App(), deletePermanentlyFromTrash(), fetchCommitteeImages(), fetchTrashBin(), generateUniqueId(), processOfflineQueue()

### Community 7 - "Local Storage Cache"
Cohesion: 0.67
Nodes (5): deleteCommitteeFromStorage(), loadCommittees(), resetStorageToDefault(), saveCommittees(), upsertCommitteeInStorage()

## Knowledge Gaps
- **25 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Build Dependencies` to `Runtime Dependencies`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Build Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._