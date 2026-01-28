#!/usr/bin/env python3
"""
Test project creation via Supabase API directly
"""

import os
import sys
from supabase import create_client, Client

def test_project_creation():
    """Test creating a project via Supabase API"""
    print("Testing project creation via Supabase API...")

    # Get Supabase credentials from environment
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        print("Error: Supabase credentials not found in environment")
        print("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
        return False

    try:
        # Create Supabase client
        print(f"Connecting to Supabase at: {supabase_url}")
        supabase: Client = create_client(supabase_url, supabase_key)

        # First, let's check current projects
        print("\nChecking existing projects...")
        response = supabase.table('projects').select('*').execute()

        current_count = len(response.data) if response.data else 0
        print(f"Current number of projects: {current_count}")

        if response.data:
            print("Existing projects:")
            for project in response.data[:3]:  # Show first 3
                print(f"  - {project.get('name')} (ID: {project.get('id')})")

        # Try to create a new project
        print("\nAttempting to create a new project...")

        # Note: This will likely fail due to RLS (Row Level Security)
        # Projects require a user_id, and RLS ensures users can only access their own projects
        test_project_data = {
            'name': 'Test Project from API',
            'description': 'Created via Supabase API test',
            # Note: We can't set user_id without authentication
        }

        try:
            response = supabase.table('projects').insert(test_project_data).execute()
            print(f"Project creation response: {response}")

            if response.data:
                print(f"✓ Project created successfully!")
                print(f"  ID: {response.data[0].get('id')}")
                print(f"  Name: {response.data[0].get('name')}")
                return True
            else:
                print("✗ No data returned from project creation")
                return False

        except Exception as e:
            print(f"✗ Project creation failed (expected due to RLS): {e}")
            print("This is expected - projects require authentication.")

            # Try a different approach - check if we can query projects
            print("\nTesting project query...")
            try:
                response = supabase.table('projects').select('count').execute()
                print(f"Query response: {response}")
            except Exception as query_error:
                print(f"Query also failed: {query_error}")

            return False

    except Exception as e:
        print(f"✗ Error connecting to Supabase: {e}")
        return False

if __name__ == '__main__':
    # Try to load environment variables from .env.local
    try:
        with open('/Users/yw/development/test-claude/.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key] = value
    except FileNotFoundError:
        print("Warning: .env.local file not found")

    success = test_project_creation()
    sys.exit(0 if success else 1)