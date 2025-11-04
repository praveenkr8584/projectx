# TODO: Make Booking Form Global and Standardize Room Types/Statuses

## Completed
- [x] Move BookingForm.jsx from frontend/src/components/booking/ to frontend/src/components/common/
- [x] Remove old booking directory
- [x] Update import in App.jsx to use common/BookingForm
- [x] Update BookingForm to use centralized api.js instead of direct axios
- [x] Standardize room types to "Single", "Double", "Deluxe", "Suite" in UserRooms.jsx
- [x] Standardize room types to "Single", "Double", "Deluxe", "Suite" in RoomList.jsx
- [x] Standardize room types to "Single", "Double", "Deluxe", "Suite" in BookingForm.jsx
- [x] Standardize status to lowercase "available" in BookingForm.jsx
- [x] Standardize status to lowercase "available" in admin/Bookings.jsx
- [x] Make room type filtering case-insensitive in BookingForm.jsx
- [x] Make room type filtering case-insensitive in admin/Bookings.jsx
- [x] Update BookingForm to accept props: onSubmitSuccess, initialMessage, onMessageChange
- [x] Replace inline booking form in admin/Bookings.jsx with BookingForm component using props
- [x] Replace all direct axios usage with centralized api.js across all frontend components

## Pending
- [ ] Test the changes by running the app and verifying booking functionality in both admin and user modules
- [ ] Ensure date conflict checking is working in backend for availability
- [ ] Verify room types and statuses are uniform across all components
