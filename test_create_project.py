#!/usr/bin/env python3
"""
Test script for creating a new project in the Vibe Coders app.
This script will:
1. Navigate to the projects page
2. Click the "New Project" button
3. Fill in the project form
4. Submit the form
5. Verify the project was created
"""

from playwright.sync_api import sync_playwright
import time
import sys

def test_create_project():
    """Test the project creation flow"""
    print("Starting project creation test...")

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the projects page
            print("Navigating to http://localhost:3000/projects...")
            page.goto('http://localhost:3000/projects')

            # Wait for network idle to ensure page is fully loaded
            page.wait_for_load_state('networkidle')
            print("Page loaded, waiting for content...")

            # Wait a bit for any client-side rendering
            page.wait_for_timeout(2000)

            # Take a screenshot for debugging
            page.screenshot(path='/tmp/projects_page.png', full_page=True)
            print("Screenshot saved to /tmp/projects_page.png")

            # Check if we're on the login page (might need authentication)
            current_url = page.url
            print(f"Current URL: {current_url}")

            if '/auth/login' in current_url or '/auth' in current_url:
                print("Detected authentication required. Attempting to login...")

                # Try to find and fill login form
                try:
                    # Look for email field
                    email_field = page.locator('input[type="email"], input[name="email"]')
                    if email_field.count() > 0:
                        email_field.first.fill('test@example.com')
                        print("Filled email field")

                    # Look for password field
                    password_field = page.locator('input[type="password"], input[name="password"]')
                    if password_field.count() > 0:
                        password_field.first.fill('password123')
                        print("Filled password field")

                    # Look for login button
                    login_button = page.locator('button:has-text("Login"), button:has-text("Sign In")')
                    if login_button.count() > 0:
                        login_button.first.click()
                        print("Clicked login button")
                        page.wait_for_load_state('networkidle')
                        page.wait_for_timeout(2000)
                except Exception as e:
                    print(f"Login attempt failed: {e}")

            # Now try to find the "New Project" button
            print("Looking for 'New Project' button...")

            # Try different selectors for the button
            new_project_selectors = [
                'button:has-text("New Project")',
                'button:has-text("Create First Project")',
                'button:has-text("Add Project")',
                '[data-testid="new-project-button"]',
                '.new-project-button',
                'button >> text=/new project/i',
                'button >> text=/create project/i'
            ]

            new_project_button = None
            for selector in new_project_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        new_project_button = page.locator(selector).first
                        print(f"Found button with selector: {selector}")
                        break
                except:
                    continue

            if not new_project_button:
                # Try to find any button with plus icon
                print("Trying to find button with plus icon...")
                plus_buttons = page.locator('button:has(svg)').all()
                for btn in plus_buttons:
                    try:
                        btn_text = btn.text_content().lower()
                        if 'project' in btn_text or 'new' in btn_text or 'create' in btn_text:
                            new_project_button = btn
                            print("Found button with plus icon")
                            break
                    except:
                        continue

            if not new_project_button:
                # Take another screenshot to see what's on the page
                page.screenshot(path='/tmp/projects_page_no_button.png', full_page=True)
                print("Could not find New Project button. Screenshot saved.")
                print("Page content preview:")
                print(page.content()[:2000])
                return False

            # Click the New Project button
            print("Clicking New Project button...")
            new_project_button.click()
            page.wait_for_timeout(1000)

            # Look for the dialog/form
            print("Looking for project creation form...")

            # Try to find form fields
            name_field_selectors = [
                'input[placeholder*="Project"], input[placeholder*="Name"], input[name="name"]',
                'input:has-text("Project Name")',
                'input >> nth=0'
            ]

            name_field = None
            for selector in name_field_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        name_field = page.locator(selector).first
                        print(f"Found name field with selector: {selector}")
                        break
                except:
                    continue

            if not name_field:
                # Take screenshot of dialog
                page.screenshot(path='/tmp/project_dialog.png', full_page=True)
                print("Could not find name field. Screenshot saved.")
                return False

            # Fill in the form
            print("Filling project form...")
            name_field.fill('Test Project from Automation')

            # Try to find description field
            desc_field_selectors = [
                'textarea[placeholder*="description"], textarea[name="description"]',
                'textarea',
                'textarea >> nth=0'
            ]

            for selector in desc_field_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        desc_field = page.locator(selector).first
                        desc_field.fill('This is a test project created by automation script')
                        print("Filled description field")
                        break
                except:
                    continue

            # Look for submit button
            submit_button_selectors = [
                'button:has-text("Create Project")',
                'button:has-text("Save")',
                'button:has-text("Submit")',
                'button[type="submit"]',
                'form button:has-text("Create")'
            ]

            submit_button = None
            for selector in submit_button_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        submit_button = page.locator(selector).first
                        print(f"Found submit button with selector: {selector}")
                        break
                except:
                    continue

            if not submit_button:
                print("Could not find submit button")
                return False

            # Click submit
            print("Submitting form...")
            submit_button.click()

            # Wait for submission
            page.wait_for_timeout(3000)

            # Check for success
            print("Checking for success...")

            # Look for success indicators
            success_indicators = [
                'text="Project created successfully"',
                'text="successfully"',
                '[data-testid="project-card"]:has-text("Test Project from Automation")',
                'text="Test Project from Automation"'
            ]

            success = False
            for indicator in success_indicators:
                try:
                    if page.locator(indicator).count() > 0:
                        print(f"Success indicator found: {indicator}")
                        success = True
                        break
                except:
                    continue

            if success:
                print("✓ Project creation test PASSED!")
                page.screenshot(path='/tmp/project_created.png', full_page=True)
                print("Success screenshot saved to /tmp/project_created.png")
            else:
                print("✗ Project creation test FAILED - no success indicator found")
                page.screenshot(path='/tmp/project_failed.png', full_page=True)
                print("Failure screenshot saved to /tmp/project_failed.png")
                print("Page content:")
                print(page.content()[:3000])

            return success

        except Exception as e:
            print(f"Error during test: {e}")
            import traceback
            traceback.print_exc()

            # Take screenshot on error
            try:
                page.screenshot(path='/tmp/test_error.png', full_page=True)
                print("Error screenshot saved to /tmp/test_error.png")
            except:
                pass

            return False

        finally:
            browser.close()

if __name__ == '__main__':
    success = test_create_project()
    sys.exit(0 if success else 1)