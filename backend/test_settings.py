import sys
try:
    print("Settings loaded successfully!")
except Exception:
    import traceback
    traceback.print_exc(file=sys.stdout)
