#!/bin/bash
echo "Setting up environment..."
python3 -m virtualenv -p `which python3` venv
ABS_PATH="$(pwd)/venv/bin/activate"
source "$ABS_PATH"
pip install -r requirements.txt
python3 manage.py migrate