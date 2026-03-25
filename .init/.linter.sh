#!/bin/bash
cd /home/kavia/workspace/code-generation/insurance-fraud-detection-and-investigation-platform-2292/react_tailwind_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

