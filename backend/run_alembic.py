"""Helper script to run alembic commands with SQLite DATABASE_URL."""
import os
import sys

# Set DATABASE_URL for SQLite dev environment
os.environ.setdefault("DATABASE_URL", "sqlite:///./xteam_pro.db")

# Change to backend directory so alembic.ini is found
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

from alembic.config import main

if __name__ == "__main__":
    main(argv=sys.argv[1:])
