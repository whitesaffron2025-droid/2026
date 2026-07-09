# Campaign Dashboard Section Structure

This document is the official modular build map for the 2026 Campaign Dashboard.

## Current foundation

The repo currently contains a static GitHub Pages dashboard connected to Supabase table `public."2026"`.

Current app files:

```text
2026/
├── index.html
├── styles.css
├── app-native.js
├── app-fixed.js
├── app.js
├── README.md
├── SECTION-STRUCTURE.md
└── .nojekyll
```

Primary live script: `app-native.js`.

## Core sections to implement first

### Phase 1: Foundation

- Header Section
- Statistics Cards Section
- Basic Filter Bar Section
- Campaign Table Section
- Pagination Section

### Phase 2: Visualization

- Charts Section
- Progress Section
- Quick Actions Section
- Status Table Section

### Phase 3: Campaign features

- D2D Overview Section
- Phone Status Overview
- Voter Profile Section
- Bulk Actions Section

### Phase 4: Team management

- Assigner Management Section
- Team Performance Section
- Assignment Dashboard

### Phase 5: Analytics and reports

- Advanced Analytics Section
- Report Builder Section
- Data Export Section

### Phase 6: Administration

- User Management Section
- System Settings Section
- Security Sections

### Phase 7: Advanced features

- Geographic Sections
- Calendar and Scheduling
- Goals and Targets

### Phase 8: Polish and support

- Help Center Section
- Theme Customization
- Mobile Optimization

## Full section catalog

### 1. Dashboard

- Header Section
- Statistics Cards Section
- Charts Section
- Progress Section
- Status Table Section
- Quick Actions Section

### 2. Campaign Management

- Campaign Header Section
- Filter Bar Section
- Campaign Table Section
- Bulk Actions Section
- Pagination Section

### 3. Team and Assignment

- Assigner Management Section
- Team Performance Section
- Assignment Dashboard

### 4. D2D Door-to-Door

- D2D Overview Section
- D2D Filter Section
- D2D Analytics Section
- D2D Schedule Section

### 5. Phone Banking

- Phone Status Overview
- Phone Filter Section
- Phone Analytics Section
- Call Schedule Section

### 6. Voter Management

- Voter Profile Section
- Voter Status Section
- Voter Analytics Section

### 7. Transport Management

- Transport Overview Section
- Transport Filter Section
- Transport Analytics Section

### 8. Geographic

- Area / Location Section
- Election Box Section

### 9. Analytics and Reporting

- Advanced Analytics Section
- Report Builder Section
- Data Export Section

### 10. Administration

- User Management Section
- System Settings Section
- Data Management Section

### 11. Mobile and Responsive

- Mobile Navigation Section
- Mobile View Section

### 12. Notifications and Alerts

- Notification Center
- Alert Configuration

### 13. Audit and Logging

- Activity Log Section
- Audit Trail Section

### 14. Documentation and Help

- Help Center Section
- Support Section

### 15. Calendar and Scheduling

- Campaign Calendar Section
- Task Management Section

### 16. Goals and Targets

- Goals Dashboard
- Performance Metrics

### 17. Integration

- Integration Configuration
- Data Sync Section

### 18. Security

- Security Settings
- Access Control

### 19. Export and Print

- Export Options
- Print Options

### 20. Customization

- Theme Customization
- Dashboard Customization

## Recommended implementation rule

Each section should be built as an independent module. The dashboard should not depend on one huge script forever. The next major refactor should move logic into:

```text
/js/config.js
/js/data.js
/js/metrics.js
/js/render-dashboard.js
/js/render-campaigns.js
/js/render-analytics.js
/js/actions.js
```

This keeps the system easier to audit and safer to update.
