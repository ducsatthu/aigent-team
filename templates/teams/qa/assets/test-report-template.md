---
name: Test Report Template
description: Standard template for test execution reports
format: markdown
tags: [qa, testing, template]
---

# Test Report Template

## Test Report: [Feature/Sprint Name]

**Date:** [YYYY-MM-DD]
**Tester:** [Name or Agent ID]
**Environment:** [staging / production / local]
**Build:** [Version or commit hash]

### Summary

| Metric | Value |
|--------|-------|
| Total test cases | 0 |
| Passed | 0 |
| Failed | 0 |
| Blocked | 0 |
| Not executed | 0 |
| Pass rate | 0% |

### Test Results by Category

#### Unit Tests
- **Status:** Pass / Fail
- **Coverage:** [X]%
- **Notes:** [Summary]

#### Integration Tests
- **Status:** Pass / Fail
- **Notes:** [Summary]

#### E2E Tests
- **Status:** Pass / Fail
- **Notes:** [Summary]

### Failed Test Cases

| Test ID | Description | Expected | Actual | Severity |
|---------|-------------|----------|--------|----------|
| [ID] | [Description] | [Expected] | [Actual] | Critical/High/Medium/Low |

### Blocked Test Cases

| Test ID | Description | Blocker |
|---------|-------------|---------|
| [ID] | [Description] | [Reason] |

### Risks and Recommendations
- [Identified risks]
- [Recommended actions before release]

### Sign-off
- [ ] All critical tests passed
- [ ] No open P0/P1 defects
- [ ] Performance within acceptable thresholds
- [ ] Ready for release: Yes / No
