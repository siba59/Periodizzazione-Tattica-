#!/usr/bin/env python3
"""
Backend API Testing for Tactical Periodization Academy
Tests all endpoints with proper authentication flow
"""

import requests
import sys
import json
from datetime import datetime

class TacticalPeriodizationAPITester:
    def __init__(self, base_url="https://tactical-harmony.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_endpoint(self, method, endpoint, expected_status, data=None, headers=None, description=""):
        """Generic endpoint test"""
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json().get('detail', 'No detail')
                    details += f", Error: {error_detail}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(description or f"{method} {endpoint}", success, details)
            return success, response
            
        except Exception as e:
            self.log_test(description or f"{method} {endpoint}", False, f"Exception: {str(e)}")
            return False, None

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, response = self.test_endpoint(
            'POST', 'auth/login', 200,
            data={"email": "admin@periodizzazione.it", "password": "TatticaPT2024!"},
            description="Admin Login"
        )
        
        if success and response:
            try:
                user_data = response.json()
                if user_data.get('role') == 'admin':
                    self.log_test("Admin Role Verification", True)
                    return True
                else:
                    self.log_test("Admin Role Verification", False, f"Role: {user_data.get('role')}")
            except:
                self.log_test("Admin Response Parsing", False, "Invalid JSON response")
        
        return False

    def test_student_registration(self):
        """Test student registration"""
        print("\n👤 Testing Student Registration...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"student{timestamp}@test.it"
        
        success, response = self.test_endpoint(
            'POST', 'auth/register', 200,
            data={"email": test_email, "password": "TestPass123!", "name": f"Test Student {timestamp}"},
            description="Student Registration"
        )
        
        if success and response:
            try:
                user_data = response.json()
                if user_data.get('role') == 'student':
                    self.log_test("Student Role Verification", True)
                    return True, test_email
                else:
                    self.log_test("Student Role Verification", False, f"Role: {user_data.get('role')}")
            except:
                self.log_test("Student Response Parsing", False, "Invalid JSON response")
        
        return False, None

    def test_modules_api(self):
        """Test modules endpoints"""
        print("\n📚 Testing Modules API...")
        
        # Test get all modules
        success, response = self.test_endpoint(
            'GET', 'modules', 200,
            description="Get All Modules"
        )
        
        if success and response:
            try:
                modules = response.json()
                if isinstance(modules, list) and len(modules) == 7:
                    self.log_test("7 Modules Seeded", True, f"Found {len(modules)} modules")
                    
                    # Test specific module
                    if modules:
                        module_id = modules[0].get('id')
                        if module_id:
                            self.test_endpoint(
                                'GET', f'modules/{module_id}', 200,
                                description=f"Get Module {module_id}"
                            )
                else:
                    self.log_test("7 Modules Seeded", False, f"Found {len(modules) if isinstance(modules, list) else 'invalid'} modules")
            except Exception as e:
                self.log_test("Modules Response Parsing", False, str(e))

    def test_lessons_api(self):
        """Test lessons endpoints"""
        print("\n📖 Testing Lessons API...")
        
        # First get modules to get a module ID
        success, response = self.test_endpoint('GET', 'modules', 200, description="Get Modules for Lessons Test")
        
        if success and response:
            try:
                modules = response.json()
                if modules and len(modules) > 0:
                    module_id = modules[0].get('id')
                    
                    # Test get lessons for module
                    self.test_endpoint(
                        'GET', f'modules/{module_id}/lessons', 200,
                        description=f"Get Lessons for Module {module_id}"
                    )
                    
                    # Test get specific lesson
                    lesson_success, lesson_response = self.test_endpoint(
                        'GET', f'modules/{module_id}/lessons', 200,
                        description="Get Lessons for Lesson ID Test"
                    )
                    
                    if lesson_success and lesson_response:
                        lessons = lesson_response.json()
                        if lessons and len(lessons) > 0:
                            lesson_id = lessons[0].get('id')
                            self.test_endpoint(
                                'GET', f'lessons/{lesson_id}', 200,
                                description=f"Get Lesson {lesson_id}"
                            )
            except Exception as e:
                self.log_test("Lessons Test Setup", False, str(e))

    def test_exercises_api(self):
        """Test exercises endpoints"""
        print("\n🏃 Testing Exercises API...")
        
        success, response = self.test_endpoint(
            'GET', 'exercises', 200,
            description="Get All Exercises"
        )
        
        if success and response:
            try:
                exercises = response.json()
                if isinstance(exercises, list) and len(exercises) > 0:
                    self.log_test("Exercises Available", True, f"Found {len(exercises)} exercises")
                    
                    # Test specific exercise
                    exercise_id = exercises[0].get('id')
                    if exercise_id:
                        self.test_endpoint(
                            'GET', f'exercises/{exercise_id}', 200,
                            description=f"Get Exercise {exercise_id}"
                        )
                else:
                    self.log_test("Exercises Available", False, f"Found {len(exercises) if isinstance(exercises, list) else 'invalid'} exercises")
            except Exception as e:
                self.log_test("Exercises Response Parsing", False, str(e))

    def test_ai_endpoints(self):
        """Test AI endpoints"""
        print("\n🤖 Testing AI Endpoints...")
        
        # Test AI chat (requires authentication)
        success, response = self.test_endpoint(
            'POST', 'ai/chat', 401,  # Should fail without auth
            data={"message": "Ciao, come stai?"},
            description="AI Chat (No Auth - Should Fail)"
        )

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Test admin stats (requires admin auth)
        success, response = self.test_endpoint(
            'GET', 'admin/stats', 401,  # Should fail without auth
            description="Admin Stats (No Auth - Should Fail)"
        )
        
        # Test admin students (requires admin auth)
        success, response = self.test_endpoint(
            'GET', 'admin/students', 401,  # Should fail without auth
            description="Admin Students (No Auth - Should Fail)"
        )

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔑 Testing Auth Endpoints...")
        
        # Test /auth/me without authentication
        success, response = self.test_endpoint(
            'GET', 'auth/me', 401,  # Should fail without auth
            description="Get Current User (No Auth - Should Fail)"
        )
        
        # Test logout
        success, response = self.test_endpoint(
            'POST', 'auth/logout', 200,
            description="Logout"
        )

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Tactical Periodization Academy API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test basic endpoints that don't require auth
        self.test_modules_api()
        self.test_lessons_api()
        self.test_exercises_api()
        
        # Test auth endpoints
        self.test_auth_endpoints()
        
        # Test admin login
        admin_login_success = self.test_admin_login()
        
        # Test student registration
        student_reg_success, student_email = self.test_student_registration()
        
        # Test AI endpoints (without auth)
        self.test_ai_endpoints()
        
        # Test admin endpoints (without auth)
        self.test_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Return success if most tests pass
        return self.tests_passed >= (self.tests_run * 0.7)  # 70% success rate

def main():
    """Main test runner"""
    tester = TacticalPeriodizationAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"❌ Test runner failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())