#!/bin/bash

# check if the script runs as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root" 1>&2
    echo "Try: sudo $0"
    exit 1
fi

ROOT="$(dirname "$0")"

echo "only reading" > $ROOT/utils/file/_tests/not_writeable.txt