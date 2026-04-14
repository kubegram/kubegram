#!/bin/bash
set -e

echo "Stopping test services..."

docker-compose -f docker-compose.test.yml down -v

echo "Test services stopped and volumes removed!"
