# This is a helper script to extract contract addresses from the config.yaml file for frontend local configuration.

#!/bin/bash
set -e # exit on error

CONFIG_YAML="../../.aptos/config.yaml"
OUTPUT_FILE="uiConfig.js"

if [ ! -f "$CONFIG_YAML" ]; then
  echo "Config file not found at: $CONFIG_YAML"
  exit 1
fi

if ! command -v yq &> /dev/null; then
  echo "yq command not found. Please install yq version 4+ (https://github.com/mikefarah/yq)."
  exit 1
fi

test_val=$(yq e '.profiles.aave_mock_underlyings.account' "$CONFIG_YAML")
if [ -z "$test_val" ]; then
  echo "No value found for '.profiles.aave_mock_underlyings.account'. Please check your YAML file and yq version."
  exit 1
fi

declare -a KEYS=(
  "UNDERLYING_TOKENS:.profiles.aave_mock_underlyings.account"
  "AAVE_ACL:.profiles.aave_acl.account"
  "AAVE_CONFIG:.profiles.aave_config.account"
  "AAVE_ORACLE:.profiles.aave_oracle.account"
  "AAVE_POOL:.profiles.aave_pool.account"
  "AAVE_DATA:.profiles.aave_data.account"
)

addresses_output=""
for entry in "${KEYS[@]}"; do
  IFS=":" read -r key yaml_path <<< "$entry"
  # Extract the address using yq
  address=$(yq e "$yaml_path" "$CONFIG_YAML")
  # (Optional) Verify that address is nonempty
  if [ -z "$address" ]; then
    echo "Warning: No value for $yaml_path"
  fi
  # Append the line. Remove quotes around the key if you want unquoted JS property names.
  addresses_output+="    ${key}: '${address}',"$'\n'
done

# Remove the trailing comma from the last address
addresses_output=$(echo "$addresses_output" | sed '$ s/,$//')

# Create the JavaScript output file
cat << EOF > "$OUTPUT_FILE"
const localConfig = {
  network: 'local',
  addresses: {
$addresses_output
  },
};
EOF

echo "Updated addresses written to $OUTPUT_FILE"
