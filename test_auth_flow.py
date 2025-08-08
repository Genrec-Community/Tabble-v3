#!/usr/bin/env python3
"""
Test the authentication flow and verify database is empty
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_database_empty():
    """Test that database is empty except for hotels"""
    print("🔄 Testing database state...")
    
    # Test with hotel authentication
    headers = {
        "x-session-id": "test-session-1",
        "x-hotel-name": "tabble_new",
        "x-hotel-password": "myhotel"
    }
    
    # Test menu (should be empty)
    response = requests.get(f"{BASE_URL}/customer/api/menu", headers=headers)
    print(f"Menu response: {response.status_code}")
    
    if response.status_code == 200:
        menu = response.json()
        print(f"Menu items: {len(menu)}")
        if len(menu) == 0:
            print("✅ Menu is empty as expected")
        else:
            print(f"⚠️  Menu has {len(menu)} items")
    
    # Test orders (should be empty)
    response = requests.get(f"{BASE_URL}/admin/orders", headers=headers)
    print(f"Orders response: {response.status_code}")
    
    if response.status_code == 200:
        orders = response.json()
        print(f"Orders: {len(orders)}")
        if len(orders) == 0:
            print("✅ Orders are empty as expected")
        else:
            print(f"⚠️  Found {len(orders)} orders")

def test_hotel_authentication():
    """Test hotel authentication"""
    print("\n🔄 Testing hotel authentication...")
    
    # Test valid credentials
    response = requests.post(
        f"{BASE_URL}/settings/switch-hotel",
        json={"database_name": "tabble_new", "password": "myhotel"},
        headers={"x-session-id": "test-session-auth"}
    )
    
    print(f"Valid auth response: {response.status_code}")
    if response.status_code == 200:
        print("✅ Valid authentication successful")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Valid authentication failed: {response.json()}")
    
    # Test invalid credentials
    response = requests.post(
        f"{BASE_URL}/settings/switch-hotel",
        json={"database_name": "tabble_new", "password": "wrong_password"},
        headers={"x-session-id": "test-session-auth-2"}
    )
    
    print(f"Invalid auth response: {response.status_code}")
    if response.status_code == 401:
        print("✅ Invalid authentication properly rejected")
    else:
        print(f"❌ Invalid authentication should be rejected: {response.json()}")

def test_hotel_list():
    """Test getting hotel list"""
    print("\n🔄 Testing hotel list...")
    
    response = requests.get(f"{BASE_URL}/settings/hotels")
    print(f"Hotels list response: {response.status_code}")
    
    if response.status_code == 200:
        hotels = response.json()
        print(f"Available hotels: {hotels}")
        print("✅ Hotel list working!")
        return True
    else:
        print(f"❌ Hotel list failed: {response.json()}")
        return False

def test_protected_endpoints():
    """Test that endpoints require authentication"""
    print("\n🔄 Testing protected endpoints...")
    
    # Test without authentication
    response = requests.get(f"{BASE_URL}/customer/api/menu")
    print(f"Menu without auth: {response.status_code}")
    
    if response.status_code in [400, 401]:
        print("✅ Menu properly protected")
    else:
        print(f"❌ Menu should require authentication: {response.json()}")
    
    # Test admin endpoint without auth
    response = requests.get(f"{BASE_URL}/admin/orders")
    print(f"Admin orders without auth: {response.status_code}")
    
    if response.status_code in [400, 401]:
        print("✅ Admin endpoints properly protected")
    else:
        print(f"❌ Admin should require authentication: {response.json()}")
    
    # Test chef endpoint without auth
    response = requests.get(f"{BASE_URL}/chef/orders/pending")
    print(f"Chef orders without auth: {response.status_code}")
    
    if response.status_code in [400, 401]:
        print("✅ Chef endpoints properly protected")
    else:
        print(f"❌ Chef should require authentication: {response.json()}")

def main():
    """Run all tests"""
    print("🚀 Testing authentication flow and empty database...\n")
    
    tests = [
        test_hotel_list,
        test_hotel_authentication,
        test_protected_endpoints,
        test_database_empty
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Authentication flow is working correctly!")
        print("✅ Database is empty and ready for new data")
        print("✅ All endpoints are properly protected")
        print("✅ Hotel authentication is working")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

if __name__ == "__main__":
    main()
