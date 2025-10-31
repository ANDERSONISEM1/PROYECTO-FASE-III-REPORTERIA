#!/usr/bin/env python3
"""
Script de prueba para la API de Python
"""
import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5082"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure it's running on port 5082")
        return False

def test_root():
    """Test root endpoint"""
    print("🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint: {data['message']}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_register_user():
    """Test user registration"""
    print("🔍 Testing user registration...")
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        if response.status_code == 200:
            print("✅ User registration successful")
            return response.json()
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None

def test_login(username="testuser", password="testpass123"):
    """Test user login"""
    print("🔍 Testing user login...")
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful")
            return data["access_token"]
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    print("🔍 Testing protected endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Protected endpoint: Welcome {data['username']}")
            return True
        else:
            print(f"❌ Protected endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")
        return False

def test_teams_endpoint():
    """Test teams endpoint (public)"""
    print("🔍 Testing teams endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/teams/")
        if response.status_code == 200:
            teams = response.json()
            print(f"✅ Teams endpoint: Found {len(teams)} teams")
            return True
        else:
            print(f"❌ Teams endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Teams endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting API Tests for Marcador Basketball Python API")
    print("=" * 60)
    
    # Test basic connectivity
    if not test_health():
        print("❌ API is not accessible. Exiting tests.")
        return
    
    if not test_root():
        print("❌ Root endpoint failed. Exiting tests.")
        return
    
    # Test authentication flow
    user = test_register_user()
    if user:
        token = test_login()
        if token:
            test_protected_endpoint(token)
    
    # Test public endpoints
    test_teams_endpoint()
    
    print("=" * 60)
    print("🏁 API Tests completed!")
    print("\n📚 API Documentation available at:")
    print(f"   • Swagger UI: {BASE_URL}/docs")
    print(f"   • ReDoc: {BASE_URL}/redoc")

if __name__ == "__main__":
    main()
