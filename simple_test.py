#!/usr/bin/env python3
"""
Simple test to check if the projects page is accessible
"""

import requests
import sys

def test_projects_page():
    """Test if the projects page is accessible"""
    print("Testing projects page accessibility...")

    try:
        # Try to access the projects page
        url = "http://localhost:3000/projects"
        print(f"Requesting: {url}")

        response = requests.get(url, timeout=10)

        print(f"Status code: {response.status_code}")
        print(f"Content length: {len(response.text)} characters")

        # Check if we got a valid response
        if response.status_code == 200:
            print("✓ Projects page is accessible")

            # Check for common elements in the page
            content = response.text.lower()

            if 'project' in content:
                print("✓ Page contains 'project' keyword")

            if 'login' in content or 'auth' in content:
                print("⚠ Page appears to require authentication")

            # Save a sample of the page
            with open('/tmp/projects_page_sample.html', 'w') as f:
                f.write(response.text[:5000])
            print("✓ Page sample saved to /tmp/projects_page_sample.html")

            return True
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("✗ Connection error - server may not be running")
        return False
    except requests.exceptions.Timeout:
        print("✗ Request timeout")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == '__main__':
    success = test_projects_page()
    sys.exit(0 if success else 1)