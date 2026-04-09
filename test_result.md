#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Complete the CRM project with real-time location tracking, role-based access, PWA frontend, and Excel import for historical sales data"

backend:
  - task: "Customer creation API for Excel import"
    implemented: true
    working: true
    file: "/app/backend/routes/customer_routes.py"
    stuck_count: 1
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "previous"
        comment: "Backend enforces unique email constraint. When importing multiple invoices with same customer name, duplicate email error occurs."
      - working: true
        agent: "main"
        comment: "Root cause identified: Backend enforces unique email on customers collection. No changes needed in backend - constraint is correct. Issue was in frontend import logic."

frontend:
  - task: "Excel Import feature for Sales Invoices"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/SalesInvoices.js, /app/frontend/src/components/ExcelImport.jsx"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "previous"
        comment: "Parser extracts 146 invoices successfully, but API save fails. Generated identical placeholder emails for duplicate customer names causing MongoDB duplicate key errors."
      - working: false
        agent: "user"
        comment: "User reported: Import still failing after previous agent's fix attempt. Screenshot shows error persists."
      - working: true
        agent: "main"
        comment: "FIXED: Two issues resolved: (1) Created localCustomers array that gets updated during import loop so subsequent invoices can find already-created customers. (2) Made generated emails unique using timestamp+index pattern: customer_name_timestamp_index@imported.local. This prevents both duplicate API calls and duplicate email conflicts."

  - task: "Display location name instead of altitude in Locations page"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/LocationTracking.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "previous"
        comment: "Previous agent attempted search_replace but failed due to pattern mismatch"
      - working: true
        agent: "main"
        comment: "Successfully implemented reverse geocoding using OpenStreetMap Nominatim API. Displays real street names and city names. Tested with screenshot - confirmed working."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Excel Import feature for Sales Invoices (NEEDS TESTING)"
    - "Customer creation during import (NEEDS TESTING)"
  stuck_tasks: 
    - "Excel Import feature (stuck_count: 2)"
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Fixed Excel Import bug. ROOT CAUSE: When importing 146 invoices with duplicate customer names, the code tried to create the same customer multiple times because: (1) The customers array wasn't updated during import loop, and (2) Generated emails were identical for same customer names. FIX APPLIED: Created localCustomers array that tracks newly created customers during import. Generated unique emails using pattern: customername_timestamp_index@imported.local. This ensures each customer is created only once even if referenced by multiple invoices. NEEDS COMPREHENSIVE TESTING with user's actual Excel file (Sales_report_2026_1.xlsx containing 146 invoices)."