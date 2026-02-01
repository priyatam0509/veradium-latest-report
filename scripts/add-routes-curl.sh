#!/bin/bash

# Add new routes via AWS RBAC API
# Based on COMPLETE_POSTMAN_API_DOCUMENTATION.md

API_URL="https://vzlfvla5pj.execute-api.us-east-1.amazonaws.com/dev"
ADMIN_EMAIL="piyush@itrenaissancellc720.onmicrosoft.com"

echo "🚀 Adding routes via AWS RBAC API..."
echo "API URL: $API_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Route 1: Dashboard Overview
echo "➕ Adding: /dashboard/overview"
curl -X POST "$API_URL/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "requesterEmail": "'"$ADMIN_EMAIL"'",
    "route": "/dashboard/overview",
    "label": "Dashboard Overview",
    "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
    "description": "Dashboard with KPIs, queue performance table, and hourly traffic using distribution APIs"
  }'
echo -e "\n"

# Route 2: Agent Performance
echo "➕ Adding: /agents/performance"
curl -X POST "$API_URL/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "requesterEmail": "'"$ADMIN_EMAIL"'",
    "route": "/agents/performance",
    "label": "Agent Performance",
    "allowedRoles": ["ADMIN", "SUPERVISOR"],
    "description": "Agent performance matrix with answered_answeredbyagent and drilldown APIs"
  }'
echo -e "\n"

# Route 3: Time Analysis Reports
echo "➕ Adding: /reports/time-analysis"
curl -X POST "$API_URL/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "requesterEmail": "'"$ADMIN_EMAIL"'",
    "route": "/reports/time-analysis",
    "label": "Time Analysis Reports",
    "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
    "description": "Daily, weekly, and monthly reports using distribution_distbyday, distbyweek, and distbymonth APIs"
  }'
echo -e "\n"

# Route 4: Missed Calls
echo "➕ Adding: /calls/missed"
curl -X POST "$API_URL/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "requesterEmail": "'"$ADMIN_EMAIL"'",
    "route": "/calls/missed",
    "label": "Missed Calls",
    "allowedRoles": ["ADMIN", "SUPERVISOR"],
    "description": "Missed calls analysis by queue and DID using unanswered APIs"
  }'
echo -e "\n"

echo "✨ Done! Check the responses above to verify routes were added."
echo "Refresh your browser to see the new routes in the sidebar."
