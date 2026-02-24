#!/bin/bash

echo "Auto Commit Service gestartet..."

while true
do
  git add .

  if ! git diff --cached --quiet
  then
    git commit -m "Auto Commit $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Committed at $(date)"
  fi

  sleep 5
done
