# Frontend Issues Fix Plan - Phase 1: ESLint Fixes

## Phase 1: ESLint Fixes (High Priority)

### 1. Remove unused imports/variables:
- [x] App.jsx: Remove `useNavigate` import
- [x] Users.jsx: Remove `axios` import, fix unused `response` variable
- [ ] Register.jsx: Remove unused `showForm` state variables, fix unused `response`
- [x] BookingForm.jsx: Remove unused `navigate`, fix unused `response`, remove unused `handleExport`
- [x] FilterPanel.jsx: Remove unused `onReset` parameter

### 2. Fix useEffect dependencies:
- [x] Users.jsx: Add `isAdmin` to dependency array or use useCallback
- [ ] BookingForm.jsx: Add missing dependencies to useEffect hooks
- [ ] RoomList.jsx: Add `fetchRooms` dependency
- [ ] ServiceList.jsx: Add `fetchServices` dependency

## Future TODO List (Phases 2-6 - To be worked on later)

### Phase 2: Critical Bug Fixes
- Replace hardcoded URLs with centralized api.js in all components (BookingForm.jsx, RoomList.jsx, ServiceList.jsx, AdminDashboard.jsx, UserDashboard.jsx, etc.)
- Fix missing `fetchAvailableRooms` function in BookingForm.jsx
- Correct DataTable.jsx callback parameters (onSelectItem, onSelectAll)
- Fix handleExport/handleImport logic in AddRoomForm.jsx and AddServiceForm.jsx
- Add missing profile.username in UserProfile.jsx and AdminProfile.jsx
- Implement proper error handling and loading states in components like AdminDashboard.jsx

### Phase 3: Code Quality Improvements
- Remove inline styles in AdminDashboard.jsx and use CSS classes
- Add client-side input validation to forms (Register.jsx, BookingForm.jsx, etc.)
- Remove console.error logs and replace with proper error handling
- Ensure consistent naming conventions (e.g., filteredRooms vs filteredServices)
- Add missing key props in mapped elements

### Phase 4: Architecture Improvements
- Split large components (AdminDashboard.jsx, BookingForm.jsx) into smaller, reusable components
- Use React Router Links instead of anchor tags in Footer.jsx
- Refactor to avoid direct DOM manipulation (window.location.href)
- Implement proper state management if needed (e.g., Redux for complex state)

### Phase 5: Security & Performance
- Add input sanitization and validation
- Implement rate limiting and CSRF protection (backend)
- Optimize API calls and add caching where appropriate
- Remove unused dependencies from package.json

### Phase 6: Testing & Documentation
- Add unit tests for components using Jest/React Testing Library
- Add integration tests for API endpoints
- Document components and functions with JSDoc
- Create README with setup and usage instructions
