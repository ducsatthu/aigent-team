---
name: Parallel Agent Orchestration
description: Coordinate multiple specialist agents working simultaneously on a shared feature
trigger: When implementing a feature that requires multiple specialist agents working simultaneously.
useCases:
  - Lead Agent coordinating FE and BE agents building a new feature in parallel
  - Lead Agent managing a cross-team effort with shared API contracts
  - Lead Agent orchestrating BA, FE, BE, and QA agents for a full-stack deliverable
tags: [lead, orchestration, coordination, parallel]
---

# Skill: Parallel Agent Orchestration

**Trigger**: When implementing a feature that requires multiple specialist agents working simultaneously.

## Steps

1. **Map the dependency graph**:
   - List all subtasks and which agent owns each
   - Identify dependencies: which tasks must complete before others can start
   - Group independent tasks that can run in parallel
   - Example:
     ```
     BA (specs) → [FE (UI) + BE (API)] → QA (integration tests) → DevOps (deploy config)
     ```

2. **Define the API contract first** (if FE + BE are both involved):
   - Have BA produce the API contract specification
   - Both FE and BE must acknowledge the contract before starting
   - Contract includes: endpoints, request/response schemas, error codes, auth requirements

3. **Spawn parallel agents with full context**:
   - Each agent gets: task description, relevant specs, file scope, acceptance criteria
   - Each agent gets: the API contract (if applicable)
   - Each agent gets: constraints and deadlines

4. **Monitor and coordinate**:
   - Check agent outputs at each milestone
   - If one agent's output changes the contract, pause and realign all affected agents
   - Resolve conflicts immediately — don't let agents proceed on divergent assumptions

5. **Integration checkpoint**:
   - After parallel work completes, verify FE and BE outputs match the same contract
   - Have QA write integration tests that exercise the full flow
   - Run all unit tests from all agents together

6. **Final review**:
   - Review combined diff for consistency
   - Verify no duplicate code or conflicting patterns across agent outputs
   - Confirm all acceptance criteria are met

## Expected Output

- Dependency graph (which tasks depend on which)
- Agent assignments with full context templates
- Integration verification results
- Combined review summary
