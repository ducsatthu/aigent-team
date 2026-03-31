---
name: Acceptance Criteria Example
description: Example of well-structured acceptance criteria for a user story
skillRef: story-decomposition
tags: [ba, requirements]
---

# Example: Acceptance Criteria

## User Story

**As a** logged-in user
**I want to** filter search results by date range
**So that** I can find relevant content from a specific time period

## Acceptance Criteria

### AC-1: Date range picker is displayed
- **Given** the user is on the search results page
- **When** they click the "Filter" button
- **Then** a date range picker appears with "Start Date" and "End Date" fields

### AC-2: Valid date range filters results
- **Given** the date range picker is visible
- **When** the user selects a start date of "2025-01-01" and end date of "2025-06-30"
- **And** clicks "Apply"
- **Then** only results within that date range are displayed
- **And** the active filter is shown as a chip/tag

### AC-3: Invalid date range shows error
- **Given** the date range picker is visible
- **When** the user selects a start date after the end date
- **Then** an inline error message reads "Start date must be before end date"
- **And** the "Apply" button is disabled

### AC-4: Clear filter restores all results
- **Given** a date range filter is active
- **When** the user clicks the "×" on the filter chip
- **Then** the filter is removed and all results are displayed again
