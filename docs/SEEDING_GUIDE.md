# Enhanced Services Seeding System

## Overview

The DriveRight application includes a comprehensive seeding system that populates your Firebase database with sample data, including your exact pricing specifications for all services. This ensures that the admin panel has data to work with immediately after setup.

## Your Services & Pricing

The seeding system includes the following services with your exact pricing:

### Training Services
- **LMV Training**: ₹6,000 (Light Motor Vehicle - Car training)
- **HMV Training**: ₹11,000 (Heavy Motor Vehicle - Commercial vehicles)
- **MCWG Training**: ₹5,000 (Motorcycle with Gear)
- **Refresher Course**: ₹3,500 (For licensed drivers to improve skills)

### Online Services
- **DL Printout Service**: ₹450 (Official driving license printout)
- **License Download**: ₹0 (Free digital license download)
- **Certificate Verification**: ₹200 (Verify driving certificates)

## How Seeding Works

### 1. Automatic Seeding (Development)
In development mode, the application automatically checks for existing services when you visit the homepage. If no enhanced services are found, it will automatically seed the database.

**To trigger automatic seeding:**
```bash
# Start the development server
npm run dev

# Visit the homepage
# Open http://localhost:9002
# The system will auto-seed if no services exist
```

### 2. Admin Panel Seeding
The admin panel includes a dedicated seeding interface at `/admin/seed` with the following options:

#### Enhanced Services Only
Seeds only the enhanced training and online services with your exact pricing.
- Quick setup for core functionality
- Uses your specified pricing structure
- Safe to run multiple times (won't create duplicates)

#### Complete Seeding
Seeds all collections including:
- Enhanced services (with your pricing)
- Sample students for testing
- Sample instructors for management
- Sample testimonials for display
- Legacy services (backup compatibility)

#### Force Reseed
**⚠️ Destructive Operation**
- Deactivates all existing services
- Creates fresh sample data
- Cannot be undone
- Use only when you need a complete reset

### 3. API-Based Seeding
You can also trigger seeding via API endpoints (requires admin authentication):

```bash
# Check seeding status
GET /api/admin/seed?action=check

# Seed enhanced services only
POST /api/admin/seed
Content-Type: application/json
{
  "action": "seed-enhanced-only"
}

# Seed all collections
POST /api/admin/seed
Content-Type: application/json
{
  "action": "seed-all"
}

# Force reseed (destructive)
POST /api/admin/seed
Content-Type: application/json
{
  "action": "force-reseed",
  "force": true
}
```

## Admin Panel Operations

Once seeding is complete, you can perform all CRUD operations from the admin panel:

### Service Management
- **View Services**: Browse all training and online services
- **Edit Pricing**: Update prices for any service
- **Modify Details**: Change descriptions, features, prerequisites
- **Toggle Status**: Activate/deactivate services
- **Add New Services**: Create additional services
- **Delete Services**: Remove services (soft delete - deactivates)

### Pricing Management
- **Base Price**: Set the fundamental price
- **Discounts**: Add percentage discounts with expiry dates
- **Taxes**: Configure GST, service tax, and other charges
- **Final Price**: Automatically calculated including discounts and taxes

### Booking Management
- **View Bookings**: See all service bookings
- **Payment Status**: Track payment completion
- **Customer Info**: Access customer details
- **Scheduling**: Manage training session dates
- **Notes**: Review customer requirements

## File Structure

### Core Seeding Files
```
src/
├── services/
│   ├── enhancedServicesService.ts    # Enhanced services manager
│   ├── sampleServiceData.ts          # Your exact pricing data
│   └── quickServicesService.ts       # Legacy service functions
├── scripts/
│   ├── seedEnhancedServices.ts       # Main seeding logic
│   └── quick-seed.cjs                # Command-line seeding tool
├── app/
│   ├── api/admin/seed/route.ts       # Seeding API endpoints
│   └── admin/seed/page.tsx           # Admin seeding interface
└── lib/
    └── initial-seeding.ts            # Auto-seeding utilities
```

### Sample Data Configuration
Your service data is defined in `src/services/sampleServiceData.ts`:
- Exact pricing as specified
- Detailed service descriptions
- Features and prerequisites
- SEO metadata
- Booking configurations

## Security

### Authentication Required
All seeding operations through the admin panel and API require admin authentication, except:
- Automatic seeding in development mode
- Homepage fallback to sample data

### Admin Access Only
Seeding endpoints are protected by the admin authentication system:
```typescript
await verifyAdmin(); // Required for all admin operations
```

### Development vs Production
- **Development**: Auto-seeding enabled, detailed logging
- **Production**: Manual seeding only, sample data fallback

## Troubleshooting

### No Services Appearing
1. Check if Firebase is properly configured
2. Visit `/admin/seed` to manually trigger seeding
3. Check browser console for error messages
4. Verify database permissions

### Seeding Fails
1. Ensure Firebase connection is working
2. Check admin authentication
3. Review server logs for specific errors
4. Try the "Enhanced Services Only" option first

### Duplicate Services
The seeding system prevents duplicates by checking existing service titles. If you see duplicates:
1. Use "Force Reseed" to clean up
2. Check for manual service additions
3. Review the sample data configuration

## Custom Configuration

### Modifying Pricing
To change your service pricing:
1. Edit `src/services/sampleServiceData.ts`
2. Update the `finalPrice` values
3. Run seeding again or use admin panel

### Adding New Services
1. Add to `sampleServiceData.ts`
2. Use "Force Reseed" to include new services
3. Or add manually through admin panel

### Removing Services
1. Set `isActive: false` in sample data
2. Or use admin panel to deactivate

## Support

The seeding system is designed to be robust and user-friendly. If you encounter issues:

1. Try the automatic seeding first (visit homepage)
2. Use the admin panel interface for manual control
3. Check the detailed logging in development mode
4. Review the API responses for specific error messages

Your exact pricing specifications are preserved throughout the system, ensuring consistency between development, testing, and production environments.
