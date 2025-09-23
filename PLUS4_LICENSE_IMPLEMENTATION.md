# Plus4 License Implementation Summary

## Overview
Added a new 4-month license type called "plus4" that can be generated from the Telegram bot. This license is similar to the Plus license but with a 4-month duration and blocks users from requesting new SpotPlayer licenses.

## Changes Made

### 1. Backend Changes

#### License Model (`backend/models/license.go`)
- Updated license type validation to include "plus4"
- Added duration logic for plus4 (4 months)
- Updated GenerateLicenseCode function to support the new type

#### Telegram Bot (`backend/services/license_type_selection.go`)
- Added "⭐ پلاس 4 ماهه" option to license type selection
- Updated license type descriptions to include plus4 features
- Added special note about SpotPlayer license restriction

#### Telegram Service (`backend/services/telegram_service.go`)
- Updated license generation success message to handle plus4 type
- Added proper display names and durations for plus4 licenses

#### SpotPlayer Controller (`backend/controllers/spotplayer_controller.go`)
- Added license type check to block plus4 users from generating new SpotPlayer licenses
- Returns appropriate error message directing users to use their existing SpotPlayer license

### 2. Frontend Changes

#### License Info Component (`src/components/LicenseInfo.tsx`)
- Updated license type display to show "⭐ پلاس 4 ماهه" for plus4 licenses
- Added special warning section for plus4 users about SpotPlayer license restrictions
- Updated duration display to show 4 months for plus4 licenses

#### Daily Limits Display (`src/components/DailyLimitsDisplay.tsx`)
- Added plus4 license type badge with orange gradient styling
- Updated license type detection logic

## Features

### Plus4 License Characteristics
- **Duration**: 4 months
- **Features**: Same as Plus license (3 visitor views, 3 supplier views per day)
- **Restriction**: Cannot request new SpotPlayer licenses
- **Display**: Shows as "⭐ پلاس 4 ماهه" with orange styling

### Telegram Bot Integration
- Admins can generate plus4 licenses through the bot
- License type selection includes the new option
- Success messages properly display the license type and duration

### User Experience
- Plus4 users see a clear warning about SpotPlayer license restrictions
- Appropriate error messages when trying to generate SpotPlayer licenses
- Visual distinction with special badge styling

## Testing

A test file has been created (`backend/test_plus4_license.go`) to verify:
- License generation works correctly
- License usage and expiration dates are set properly
- SpotPlayer license generation is blocked for plus4 users

## Usage

### For Admins (Telegram Bot)
1. Go to License Management menu
2. Select "➕ تولید لایسنس"
3. Choose "⭐ پلاس 4 ماهه"
4. Enter desired quantity (1-100)
5. Licenses will be generated and displayed

### For Users
- Plus4 license users will see a warning about SpotPlayer restrictions
- When trying to generate SpotPlayer license, they'll receive an error message
- All other platform features work normally

## Database Impact
- No database schema changes required
- Existing license table supports the new type
- Backward compatible with existing licenses

## Security Considerations
- License type validation prevents unauthorized access
- SpotPlayer generation is properly blocked at the API level
- User experience is clear about restrictions
