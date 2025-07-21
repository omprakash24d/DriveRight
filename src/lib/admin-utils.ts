import { User } from 'firebase/auth';

/**
 * Check if the current user has admin privileges
 * @param user - Firebase User object
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  try {
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if we can access admin APIs by testing the session
 * @returns Promise<boolean> - true if admin access is available, false otherwise
 */
export async function canAccessAdminAPIs(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify-session');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper function to check if we're running on the server side
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

// Helper function to fetch data from admin API endpoints
export async function fetchFromAdminAPI(endpoint: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/admin/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admin API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from admin API endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Helper function to delete data via admin API endpoints
export async function deleteFromAdminAPI(endpoint: string, id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/admin/${endpoint}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admin API delete failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting from admin API endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Helper function to create data via admin API endpoints
export async function createFromAdminAPI(endpoint: string, data: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/admin/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Admin API create failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error creating from admin API endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Helper function to update data via admin API endpoints
export async function updateFromAdminAPI(endpoint: string, id: string, data: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/admin/${endpoint}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Admin API update failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating from admin API endpoint ${endpoint}:`, error);
    throw error;
  }
}
