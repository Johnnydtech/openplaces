"""Test script to verify environment variables are loaded correctly"""
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Test required variables
print("Testing environment variable loading...\n")

required_vars = [
    "ENVIRONMENT",
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "MAPBOX_API_KEY",
    "API_PORT"
]

all_loaded = True
for var in required_vars:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if "KEY" in var or "SECRET" in var:
            masked = value[:10] + "..." if len(value) > 10 else "***"
            print(f"✅ {var}: {masked}")
        else:
            print(f"✅ {var}: {value}")
    else:
        print(f"❌ {var}: NOT LOADED")
        all_loaded = False

print()
if all_loaded:
    print("✅ All environment variables loaded successfully")
else:
    print("⚠️  Some environment variables are missing (this is expected for placeholders)")
