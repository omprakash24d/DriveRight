# DriveRight - API Documentation

## 🌐 API Overview

The DriveRight platform provides a comprehensive RESTful API for managing driving school operations. All endpoints require authentication unless otherwise specified.

**Base URL**: `https://yourdomain.com/api`

**Authentication**: Bearer token (Firebase JWT)

**Rate Limiting**: 60 requests per minute per IP address

## 📋 Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "student@example.com",
    "role": "student",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## 👥 User Management

### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "user_123",
  "email": "student@example.com",
  "role": "student",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1995-06-15",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    }
  },
  "preferences": {
    "emailNotifications": true,
    "smsNotifications": false
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:45:00Z"
}
```

### Update User Profile

```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890"
  },
  "preferences": {
    "emailNotifications": true,
    "smsNotifications": true
  }
}
```

## 📚 Course Management

### List Courses

```http
GET /api/courses?category=beginner&location=downtown&available=true
Authorization: Bearer <token>
```

**Query Parameters:**

- `category`: Filter by course category (beginner, advanced, commercial, etc.)
- `location`: Filter by location
- `available`: Show only available courses (true/false)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

**Response:**

```json
{
  "courses": [
    {
      "id": "course_123",
      "title": "Beginner Driver Education",
      "description": "Complete driver education course for new drivers",
      "category": "beginner",
      "duration": "40 hours",
      "price": 299.99,
      "location": {
        "name": "Downtown Campus",
        "address": "456 Education Ave, Anytown, CA 12345"
      },
      "schedule": {
        "startDate": "2024-02-01",
        "endDate": "2024-02-28",
        "daysOfWeek": ["Monday", "Wednesday", "Friday"],
        "time": "18:00-20:00"
      },
      "instructor": {
        "id": "instructor_456",
        "name": "Jane Smith",
        "rating": 4.8
      },
      "capacity": 20,
      "enrolled": 15,
      "available": true
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Course Details

```http
GET /api/courses/{courseId}
Authorization: Bearer <token>
```

## 📝 Enrollment Management

### Create Enrollment

```http
POST /api/enrollments
Authorization: Bearer <token>
Content-Type: multipart/form-data

courseId: course_123
emergencyContact: {
  "name": "Parent Name",
  "phone": "+1234567890",
  "relationship": "Parent"
}
photo: [file]
documents: [file1, file2]
```

**Response:**

```json
{
  "id": "enrollment_789",
  "courseId": "course_123",
  "studentId": "user_123",
  "status": "pending",
  "submittedAt": "2024-01-25T15:30:00Z",
  "documents": [
    {
      "type": "photo",
      "filename": "student_photo.jpg",
      "url": "https://storage.googleapis.com/...",
      "uploadedAt": "2024-01-25T15:30:00Z"
    }
  ],
  "emergencyContact": {
    "name": "Parent Name",
    "phone": "+1234567890",
    "relationship": "Parent"
  }
}
```

### Get Enrollments

```http
GET /api/enrollments?status=active&courseId=course_123
Authorization: Bearer <token>
```

### Update Enrollment Status (Admin only)

```http
PATCH /api/enrollments/{enrollmentId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "notes": "All documents verified"
}
```

## 📜 Certificate Management

### Generate Certificate

```http
POST /api/certificates
Authorization: Bearer <token>
Content-Type: application/json

{
  "enrollmentId": "enrollment_789",
  "certificateType": "completion",
  "completionDate": "2024-02-28"
}
```

### Get Certificates

```http
GET /api/certificates?studentId=user_123
Authorization: Bearer <token>
```

**Response:**

```json
{
  "certificates": [
    {
      "id": "cert_456",
      "studentId": "user_123",
      "courseId": "course_123",
      "type": "completion",
      "issuedAt": "2024-03-01T10:00:00Z",
      "completionDate": "2024-02-28",
      "certificateNumber": "DC-2024-001234",
      "downloadUrl": "https://storage.googleapis.com/certificates/cert_456.pdf",
      "verificationCode": "ABC123XYZ",
      "instructor": {
        "name": "Jane Smith",
        "licenseNumber": "INS-12345"
      }
    }
  ]
}
```

### Verify Certificate

```http
GET /api/certificates/verify/{verificationCode}
```

## 📊 Progress Tracking

### Get Student Progress

```http
GET /api/progress/{enrollmentId}
Authorization: Bearer <token>
```

**Response:**

```json
{
  "enrollmentId": "enrollment_789",
  "courseId": "course_123",
  "progress": {
    "completedLessons": 15,
    "totalLessons": 20,
    "completionPercentage": 75,
    "currentLesson": {
      "id": "lesson_16",
      "title": "Parallel Parking",
      "status": "in_progress"
    }
  },
  "assessments": [
    {
      "id": "assessment_1",
      "title": "Traffic Rules Quiz",
      "score": 85,
      "maxScore": 100,
      "completedAt": "2024-02-15T14:30:00Z",
      "passed": true
    }
  ],
  "practicalHours": {
    "completed": 25,
    "required": 40,
    "remaining": 15
  }
}
```

## 💳 Payment Processing

### Create Payment Intent

```http
POST /api/payments/intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "enrollmentId": "enrollment_789",
  "amount": 29999,
  "currency": "USD",
  "paymentMethod": "card"
}
```

### Get Payment History

```http
GET /api/payments?enrollmentId=enrollment_789
Authorization: Bearer <token>
```

## 👨‍🏫 Instructor Endpoints

### Get Instructor Schedule

```http
GET /api/instructors/schedule?date=2024-02-01
Authorization: Bearer <token>
```

### Update Lesson Status

```http
PATCH /api/lessons/{lessonId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Student performed well, ready for next lesson",
  "rating": 4
}
```

## 🛠️ Admin Endpoints

### Get System Statistics

```http
GET /api/admin/stats?period=month
Authorization: Bearer <token>
```

**Response:**

```json
{
  "period": "2024-01",
  "students": {
    "total": 150,
    "newThisMonth": 25,
    "active": 120
  },
  "enrollments": {
    "total": 75,
    "pending": 10,
    "approved": 60,
    "completed": 5
  },
  "revenue": {
    "total": 22497.5,
    "thisMonth": 7500.0,
    "lastMonth": 6200.0
  },
  "courses": {
    "total": 12,
    "active": 8,
    "averageOccupancy": 0.75
  }
}
```

### Manage Users

```http
GET /api/admin/users?role=student&status=active&page=1&limit=50
Authorization: Bearer <token>
```

## 🔍 Search & Filtering

### Global Search

```http
GET /api/search?q=john&type=students,courses&limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "results": [
    {
      "type": "student",
      "id": "user_123",
      "title": "John Doe",
      "subtitle": "Student - Beginner Course",
      "url": "/admin/students/user_123"
    },
    {
      "type": "course",
      "id": "course_456",
      "title": "Beginner Driver Education",
      "subtitle": "Downtown Campus - 15/20 enrolled",
      "url": "/admin/courses/course_456"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

## 📱 Webhook Events

The system can send webhook notifications for important events:

### Webhook Payload Structure

```json
{
  "event": "enrollment.approved",
  "timestamp": "2024-01-25T15:30:00Z",
  "data": {
    "enrollmentId": "enrollment_789",
    "studentId": "user_123",
    "courseId": "course_123",
    "metadata": {
      "approvedBy": "admin_456",
      "notes": "All documents verified"
    }
  },
  "signature": "sha256=..."
}
```

### Supported Events

- `enrollment.created`
- `enrollment.approved`
- `enrollment.rejected`
- `payment.completed`
- `payment.failed`
- `certificate.issued`
- `course.completed`

## ❌ Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-25T15:30:00Z",
    "requestId": "req_123456"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## 🔐 Security Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## 📊 Rate Limiting

Rate limits are applied per IP address and per authenticated user:

- **Anonymous requests**: 20 per minute
- **Authenticated requests**: 60 per minute
- **Admin requests**: 200 per minute

Rate limit headers included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

---

For additional API documentation and interactive testing, visit the [API Explorer](https://yourdomain.com/api-docs) when available.
