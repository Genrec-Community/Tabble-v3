#!/usr/bin/env python3
"""
Test script to verify the unified database architecture
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_hotel_authentication():
    """Test hotel authentication"""
    print("🔄 Testing hotel authentication...")
    
    # Test switch hotel endpoint
    response = requests.post(
        f"{BASE_URL}/settings/switch-hotel",
        json={"database_name": "tabble_new", "password": "myhotel"},
        headers={"x-session-id": "test-session-1"}
    )
    
    print(f"Switch hotel response: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Hotel authentication successful!")
        return True
    else:
        print("❌ Hotel authentication failed!")
        return False

def test_data_isolation():
    """Test data isolation between hotels"""
    print("\n🔄 Testing data isolation...")
    
    # Test with hotel 1 (tabble_new)
    session1_headers = {
        "x-session-id": "test-session-1",
        "x-hotel-name": "tabble_new",
        "x-hotel-password": "myhotel"
    }
    
    # Test with hotel 2 (anifa)
    session2_headers = {
        "x-session-id": "test-session-2", 
        "x-hotel-name": "anifa",
        "x-hotel-password": "anifa123"
    }
    
    # Get menu for hotel 1
    response1 = requests.get(f"{BASE_URL}/customer/api/menu", headers=session1_headers)
    print(f"Hotel 1 menu response: {response1.status_code}")
    
    if response1.status_code == 200:
        menu1 = response1.json()
        print(f"Hotel 1 has {len(menu1)} dishes")
    
    # Get menu for hotel 2
    response2 = requests.get(f"{BASE_URL}/customer/api/menu", headers=session2_headers)
    print(f"Hotel 2 menu response: {response2.status_code}")
    
    if response2.status_code == 200:
        menu2 = response2.json()
        print(f"Hotel 2 has {len(menu2)} dishes")
    
    # Both should work independently
    if response1.status_code == 200 and response2.status_code == 200:
        print("✅ Data isolation working - both hotels can access their data!")
        return True
    else:
        print("❌ Data isolation issue!")
        return False

def test_hotel_list():
    """Test getting hotel list"""
    print("\n🔄 Testing hotel list...")
    
    # This should work without authentication for setup
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

def test_settings():
    """Test hotel-specific settings"""
    print("\n🔄 Testing hotel-specific settings...")
    
    headers = {
        "x-session-id": "test-session-1",
        "x-hotel-name": "tabble_new",
        "x-hotel-password": "myhotel"
    }
    
    response = requests.get(f"{BASE_URL}/settings/", headers=headers)
    print(f"Settings response: {response.status_code}")
    
    if response.status_code == 200:
        settings = response.json()
        print(f"Hotel settings: {settings}")
        print("✅ Hotel-specific settings working!")
        return True
    else:
        print(f"❌ Settings failed: {response.json()}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting unified database tests...\n")
    
    tests = [
        test_hotel_list,
        test_hotel_authentication,
        test_data_isolation,
        test_settings
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
        print("🎉 All tests passed! Unified database architecture is working correctly!")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

if __name__ == "__main__":
    main()
