# ADR 010: Use PlantUML with exported SVG for the required UML diagrams

**Status:** Accepted (confirm with the instructor)  
**Date:** 2026-10-19  
**Decision log:** [Decision 10](../../plans/decision-log.md)  
**Related tasks:** D-05, D-07, D-08, D-09, D-12, D-13

## Context

Assignment 2 asks for use-case, activity (with swimlanes), sequence, class, and deployment diagrams, and gives `sequence-checkout.puml` as an example. Mermaid has no native use-case, deployment, or swimlane activity diagram, so those would be flowcharts imitating UML. GitHub does not render `.puml` files.

## Options considered

- PlantUML source plus exported SVG
- Mermaid with exported images

## Decision

Use **PlantUML** for the five required diagrams and the C4 diagrams. Commit each as a `.puml` source with an exported `.svg`. Mermaid stays for small flowcharts inside the plan documents.

## Consequences

**Benefits**

- Real UML notation for every required diagram.
- Matches the example file name in the assignment.
- C4 diagrams use the C4 library bundled with PlantUML.

**Costs and risks**

- Needs Java and Graphviz to export, and the SVG must be committed next to the source because GitHub will not render `.puml`.
- Source and image can drift apart if only one is updated.

**Follow-up**

- Convert the existing use-case overview (`D-05`) and sequence diagram (`D-08`), which are still Mermaid, to PlantUML, and update their links and export commands.
- Add the export step to the README, and check source and SVG together in `D-13`.
- **Verify first:** ask the instructor whether Mermaid is acceptable. If it is, the choice must then apply to all required diagrams, not a mix.

## Revisit if

The instructor accepts Mermaid and the team prefers one tool less.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
