#!/bin/bash

# Ensure Aptos CLI path is included
export PATH="${HOME}/.local/bin:$PATH"

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Please create a .env file using the '.env.sample' template and try again."
  exit 1
fi

# Debug: Print all environment variables
echo "Environment Variables:"
env

# Execute the passed command
exec "$@"

# Start local Aptos testnet in the background
make local-testnet-docker &
sleep 15

# Run the make commands in the specified order
make set-workspace-config
make init-workspace-config
make init-profiles
make init-test-profiles
make fund-profiles
make fund-test-profiles
make publish-all

echo "Aave aptos is running ..."

# Keep the container alive after these steps, if needed
tail -f /dev/null
