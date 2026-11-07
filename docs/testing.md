# FinSightAI Testing Strategy

## Backend Testing

### Unit Tests
- Test all route handlers
- Test analytics engine calculations
- Test AI service manager failover logic
- Test Firestore service CRUD operations
- Test auth service (register, login, profile)

### Integration Tests
- Test full auth flow (register -> login -> access protected routes)
- Test transaction CRUD with actual Firestore
- Test budget management flow
- Test savings goals lifecycle
- Test chat API with mock AI responses

### Test Files Structure
```
tests/
├── test_auth.py
├── test_transactions.py
├── test_budgets.py
├── test_goals.py
├── test_analytics.py
├── test_ai_service.py
└── test_integration.py
```

## Frontend Testing

### Component Tests
- Test auth page (login/register toggle, form validation)
- Test dashboard data rendering
- Test transaction list with empty/error states
- Test modal interactions

### E2E Tests
- Full user journey: Register -> Login -> Add Transaction -> View Dashboard -> Generate Report

## Running Tests
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm run test
```
