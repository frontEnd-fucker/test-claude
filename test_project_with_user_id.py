#!/usr/bin/env python3
"""
Test project creation with explicit user_id field.
"""

import os
import sys
import requests
import json

def load_config():
    """Load configuration from .env.local"""
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
        print(f"✓ Loaded configuration from {env_file}")
    except FileNotFoundError:
        print(f"✗ Error: {env_file} not found")
        sys.exit(1)

    return config

def test_project_creation_with_user_id():
    """Test creating a project with explicit user_id"""
    config = load_config()
    supabase_url = config['NEXT_PUBLIC_SUPABASE_URL']
    anon_key = config['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    # First, login to get user ID and token
    print("Logging in...")
    signin_url = f"{supabase_url}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json"
    }
    data = {
        "email": "markzuckerb@gmail.com",
        "password": "123123"
    }

    response = requests.post(signin_url, headers=headers, json=data, timeout=30)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text[:200])
        sys.exit(1)

    token_data = response.json()
    user_id = token_data['user']['id']
    access_token = token_data['access_token']

    print(f"✓ Logged in as user: {user_id}")
    print(f"Access token: {access_token[:30]}...")

    # Now try to create a project with user_id
    print("\nAttempting to create project with explicit user_id...")
    projects_url = f"{supabase_url}/rest/v1/projects"

    auth_headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Try without user_id first (should fail)
    print("\n1. Testing without user_id (expected to fail)...")
    project_data1 = {
        "name": "Test without user_id",
        "description": "This should fail due to RLS"
    }

    resp1 = requests.post(projects_url, headers=auth_headers, json=project_data1, timeout=30)
    print(f"Status: {resp1.status_code}")
    print(f"Response: {resp1.text[:200]}")

    # Try with user_id
    print("\n2. Testing with user_id...")
    project_data2 = {
        "name": "Test with user_id",
        "description": "Testing with explicit user_id field",
        "user_id": user_id
    }

    resp2 = requests.post(projects_url, headers=auth_headers, json=project_data2, timeout=30)
    print(f"Status: {resp2.status_code}")
    print(f"Response: {resp2.text[:200]}")

    if resp2.status_code == 201:
        project = resp2.json()[0] if isinstance(resp2.json(), list) else resp2.json()
        print(f"\n✓ Project created successfully!")
        print(f"  ID: {project.get('id')}")
        print(f"  Name: {project.get('name')}")
        return True
    else:
        print("\n✗ Project creation failed even with user_id")
        return False

    # Try another approach: check if there's a trigger or default value
    print("\n3. Checking table structure...")
    # Use service role key to bypass RLS for inspection
    service_key = config.get('SUPABASE_SERVICE_ROLE_KEY')
    if service_key:
        print("Using service role key to inspect table...")
        admin_headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json"
        }

        # Check table info
        info_url = f"{supabase_url}/rest/v1/projects"
        info_resp = requests.get(info_url, headers=admin_headers, params={"select": "*", "limit": "1"}, timeout=30)
        print(f"Table access with service key: {info_resp.status_code}")

if __name__ == '__main__':
    success = test_project_creation_with_user_id()
    sys.exit(0 if success else 1)