#!/bin/bash
echo "Setting up back-end...."
cd back-end
python3 -m virtualenv -p `which python3` venv
ABS_PATH="$(pwd)/back-end/venv/bin/activate"
source "$ABS_PATH"
pip3 install -r requirements.txt
python3 manage.py migrate
cd ../

echo "Setting up front-end..."
cd front-end
npm install
cd ..
echo "Success!"
