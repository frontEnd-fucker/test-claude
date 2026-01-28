#!/usr/bin/env python3
"""
Test script for testing project creation with existing user credentials.
Usage: python test_with_existing_user.py --email user@example.com --password yourpassword
"""

import os
import sys
import argparse
import requests
import json

def load_supabase_config():
    """Load Supabase configuration from .env.local"""
    config = {}
    env_file = '/Users/yw/development/test-claude/.env.local'

    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        config[key] = value
        print(f"✓ Loaded Supabase configuration from {env_file}")
    except FileNotFoundError:
        print(f"✗ Error: {env_file} not found")
        sys.exit(1)

    required_keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
    for key in required_keys:
        if key not in config:
            print(f"✗ Error: {key} not found in configuration")
            sys.exit(1)

    return config

def login_user(supabase_url, anon_key, email, password):
    """Log in a user and return the session token"""
    print(f"Attempting to login user: {email}")

    signin_url = f"{supabase_url}/auth/v1/token?grant_type=password"

    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json"
    }

    data = {
        "email": email,
        "password": password
    }

    try:
        response = requests.post(signin_url, headers=headers, json=data, timeout=30)

        if response.status_code == 200:
            token_data = response.json()
            print(f"✓ Login successful!")
            print(f"  User ID: {token_data.get('user', {}).get('id')}")
            print(f"  Access token: {token_data.get('access_token')[:30]}...")
            return token_data
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return None

    except Exception as e:
        print(f"✗ Login error: {e}")
        return None

def test_projects_api(supabase_url, anon_key, access_token):
    """Test accessing the projects API with the user's token"""
    print("\nTesting projects API access...")

    projects_url = f"{supabase_url}/rest/v1/projects"

    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # First, list existing projects
    try:
        response = requests.get(projects_url, headers=headers, params={"select": "id,name,description,created_at"}, timeout=30)

        if response.status_code == 200:
            projects = response.json()
            print(f"✓ Successfully accessed projects API")
            print(f"  Found {len(projects)} projects")

            if projects:
                print("  Existing projects:")
                for project in projects[:5]:  # Show first 5
                    print(f"    - {project.get('name')} (ID: {project.get('id')})")
            else:
                print("  No projects found")

            return True
        else:
            print(f"✗ Projects API access failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"✗ Projects API error: {e}")
        return False

def create_test_project(supabase_url, anon_key, access_token):
    """Create a test project using the API"""
    print("\nCreating a test project...")

    projects_url = f"{supabase_url}/rest/v1/projects"

    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    project_data = {
        "name": f"Test Project from API - {os.urandom(4).hex()}",
        "description": "Created via API test script"
    }

    try:
        response = requests.post(projects_url, headers=headers, json=project_data, timeout=30)

        if response.status_code == 201:
            project = response.json()[0] if isinstance(response.json(), list) else response.json()
            print(f"✓ Project created successfully!")
            print(f"  Project ID: {project.get('id')}")
            print(f"  Project Name: {project.get('name')}")
            print(f"  Created at: {project.get('created_at')}")
            return project
        else:
            print(f"✗ Project creation failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return None

    except Exception as e:
        print(f"✗ Project creation error: {e}")
        return None

def main():
    """Main test function"""
    parser = argparse.ArgumentParser(description='Test project creation with existing user')
    parser.add_argument('--email', help='User email address')
    parser.add_argument('--password', help='User password')

    args = parser.parse_args()

    # Get credentials from args or environment
    email = args.email or os.getenv('TEST_USER_EMAIL')
    password = args.password or os.getenv('TEST_USER_PASSWORD')

    if not email or not password:
        print("Error: User credentials required")
        print("Provide credentials via:")
        print("  --email and --password arguments, or")
        print("  TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables")
        print("\nExample:")
        print("  python test_with_existing_user.py --email user@example.com --password yourpassword")
        sys.exit(1)

    print("="*60)
    print("Testing Project Creation with Existing User")
    print("="*60)

    # Load Supabase configuration
    config = load_supabase_config()
    supabase_url = config['NEXT_PUBLIC_SUPABASE_URL']
    anon_key = config['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    print(f"Supabase URL: {supabase_url}")
    print(f"User email: {email}")

    # Step 1: Login
    token_data = login_user(supabase_url, anon_key, email, password)
    if not token_data:
        print("\n❌ Login failed. Cannot proceed with testing.")
        sys.exit(1)

    access_token = token_data.get('access_token')

    # Step 2: Test projects API access
    if not test_projects_api(supabase_url, anon_key, access_token):
        print("\n⚠ Projects API test failed, but continuing...")

    # Step 3: Create a test project
    project = create_test_project(supabase_url, anon_key, access_token)

    # Step 4: Verify project was created
    if project:
        print("\n" + "="*60)
        print("✅ TEST SUCCESSFUL!")
        print("="*60)
        print(f"Successfully created project: {project.get('name')}")
        print(f"Project ID: {project.get('id')}")

        # Save token for future use
        token_file = '/tmp/user_session_token.json'
        with open(token_file, 'w') as f:
            json.dump({
                'access_token': access_token,
                'refresh_token': token_data.get('refresh_token'),
                'user_id': token_data.get('user', {}).get('id'),
                'email': email
            }, f, indent=2)
        print(f"\nSession token saved to: {token_file}")

        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("❌ TEST FAILED")
        print("="*60)
        print("Failed to create project")
        sys.exit(1)

if __name__ == '__main__':
    main()