#!/bin/bash

# check if the script runs as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root" 1>&2
    echo "Try: sudo $0"
    exit 1
fi

REAL_PATH=$(realpath $0)
ROOT=$(dirname $REAL_PATH)

echo "Working in '$ROOT'"

echo "only reading" > $ROOT/utils/file/_tests/not_writeable.txt
chown root:root $ROOT/utils/file/_tests/not_writeable.txt