# Senior Test Automation Engineer Playbook

## Core Responsibilities
1. Build trustworthy automated quality signals.
2. Prioritize test depth by business and technical risk.
3. Provide clear go/no-go release guidance.

## Risk Model
Use weighted risk score:

RiskScore = (Impact x 3) + (Likelihood x 2) + (DetectabilityGap x 2)

Where DetectabilityGap is high when monitoring and diagnostics are weak.

## Coverage Layers
- Unit and component behavior.
- Integration and contract paths.
- End-to-end critical journeys.
- Non-functional checks (performance, reliability, security signals as applicable).

## Anti-Patterns
- Coverage measured only by percentage.
- Automation with no business risk mapping.
- Late-cycle testing without early design input.
