# Demo Mode Instructions

This document provides instructions for using the demo mode feature that bypasses customer authentication for demonstration purposes.

## Overview

Demo mode allows seamless access to the customer interface without requiring phone authentication. When enabled, accessing `/customer` will automatically redirect to the menu page with pre-configured demo credentials.

## Features

- **Automatic Redirect**: Visiting `/customer` automatically redirects to the menu with demo credentials
- **Demo Customer**: Uses hardcoded customer ID (999999) with username "Demo Customer"
- **Demo Indicator**: Shows "🎭 DEMO MODE ACTIVE" badge in the menu header
- **Preserved Functionality**: All menu features work normally (ordering, cart, etc.)
- **Easy Toggle**: Simple configuration flag to enable/disable

## How to Enable Demo Mode

### 1. Frontend Configuration
Edit `frontend/src/config/demoConfig.js`:

```javascript
export const DEMO_CONFIG = {
  ENABLED: true,  // Set to true to enable demo mode
  // ... rest of config
};
```

### 2. Backend Configuration
Edit `app/routers/customer.py`:

```python
DEMO_MODE_ENABLED = True  # Set to True to enable demo mode
```

## How to Disable Demo Mode

### 1. Frontend Configuration
Edit `frontend/src/config/demoConfig.js`:

```javascript
export const DEMO_CONFIG = {
  ENABLED: false,  // Set to false to disable demo mode
  // ... rest of config
};
```

### 2. Backend Configuration
Edit `app/routers/customer.py`:

```python
DEMO_MODE_ENABLED = False  # Set to False to disable demo mode
```

## Demo Credentials

When demo mode is active, the following credentials are used:

- **Customer ID**: 999999
- **Username**: Demo Customer
- **Phone**: +91-DEMO-USER
- **Table Number**: 1
- **Unique ID**: DEMO-SESSION-ID
- **Visit Count**: 5 (shows as returning customer)

## Usage Instructions

### For Demos

1. **Enable demo mode** using the configuration above
2. **Start the application** (both frontend and backend)
3. **Navigate to** `http://localhost:3000/customer`
4. **Automatic redirect** to menu page with demo credentials
5. **Demo indicator** will be visible in the header
6. **Use normally** - all features work as expected

### After Demo

1. **Disable demo mode** using the configuration above
2. **Restart the application** to apply changes
3. **Normal authentication** will be required again

## Technical Details

### Files Modified

- `frontend/src/config/demoConfig.js` - Demo configuration
- `frontend/src/pages/customer/Login.js` - Auto-redirect logic
- `frontend/src/pages/customer/components/HeroBanner.js` - Demo indicator
- `frontend/src/services/api.js` - Demo login API
- `app/routers/customer.py` - Demo login endpoint

### API Endpoint

- **POST** `/customer/api/demo-login`
- Creates or returns demo customer with ID 999999
- Only works when `DEMO_MODE_ENABLED = True`

### Security Notes

- Demo mode should **NEVER** be enabled in production
- Demo customer ID (999999) is designed to avoid conflicts
- All demo data is clearly marked and identifiable
- Easy to clean up demo data if needed

## Troubleshooting

### Demo Mode Not Working

1. Check both frontend and backend configuration flags
2. Restart both frontend and backend servers
3. Clear browser cache and localStorage
4. Check browser console for errors

### Demo Customer Not Created

1. Ensure backend demo mode is enabled
2. Check database connectivity
3. Verify hotel/database selection is working
4. Check backend logs for errors

### Normal Authentication Still Required

1. Verify frontend demo mode is enabled
2. Check that `isDemoModeEnabled()` returns true
3. Restart frontend development server
4. Clear browser cache

## Reverting Changes

To completely remove demo mode functionality:

1. Delete `frontend/src/config/demoConfig.js`
2. Remove demo imports from Login.js and HeroBanner.js
3. Remove demo login endpoint from customer.py
4. Remove demo login method from api.js
5. Restart both servers

This ensures a clean codebase without any demo-related code.
