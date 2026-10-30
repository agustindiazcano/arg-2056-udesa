# Current state
- Branch: task/department-hover-labels, based on task/readme-banner.
- Department minimap: hide idle municipality labels; department name shows on geo hover and persists only for selectedDepartment.
- ProvinceMap passes selectedDepartment into buildDepartmentMap; deselection clears the persistent name.
- Regression coverage: web/tests/unit/departmentMapLabels.test.ts. Local tests not run (CI only).
- Earlier work in branch ancestry: README banner, reference URLs, search SVG, RIGI scroll, removed nav development badge.
- Previous CI failed at web npm test; GitHub log downloads denied HTTP 403.
- Server last verified at http://localhost:5174/.
- Next: push branch, read CI, open PR only after checks pass.
