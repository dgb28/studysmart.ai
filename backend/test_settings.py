import sys
try:
    from app.core.config import settings
    print("Settings loaded successfully!")
except Exception as e:
    import traceback
    traceback.print_exc(file=sys.stdout)
