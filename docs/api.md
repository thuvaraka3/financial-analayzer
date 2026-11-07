# FinSightAI API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
All protected endpoints require `Authorization: Bearer <token>` header.

### POST /auth/register
Register a new user.
```json
{ "fullName": "John Doe", "email": "john@example.com", "password": "securepass" }
```

### POST /auth/login
Login and receive JWT token.
```json
{ "email": "john@example.com", "password": "securepass" }
```

### GET /auth/profile
Get authenticated user profile. [Protected]

### POST /auth/logout
Logout user. [Protected]

## Transactions

### GET /transactions
Query params: `page`, `limit`, `category`, `type`. [Protected]

### POST /transactions
```json
{ "type": "income|expense", "category": "Salary|Food|...", "amount": 100000, "date": "2024-01-15", "description": "Optional" }
```

### PUT /transactions/:id
Update transaction fields. [Protected]

### DELETE /transactions/:id
Delete transaction. [Protected]

## Budgets

### GET /budgets
List all budgets. [Protected]

### POST /budgets
```json
{ "category": "Food", "monthlyLimit": 50000 }
```

### PUT /budgets/:id
Update budget. [Protected]

### DELETE /budgets/:id
Delete budget. [Protected]

## Goals

### GET /goals
List all savings goals. [Protected]

### POST /goals
```json
{ "goalName": "Emergency Fund", "targetAmount": 500000, "deadline": "2024-12-31" }
```

### PUT /goals/:id
```json
{ "currentAmount": 250000 }
```

### DELETE /goals/:id
Delete goal. [Protected]

## Analytics

### GET /analytics/dashboard
Complete dashboard data. [Protected]

### GET /analytics/spending?period=monthly
Spending analysis. [Protected]

### GET /analytics/income
Income analysis. [Protected]

### GET /analytics/savings
Savings analysis. [Protected]

### GET /analytics/budget
Budget analysis. [Protected]

### GET /analytics/forecast?periods=3
ML-powered financial forecast. [Protected]

### GET /analytics/anomalies
Fraud & anomaly detection. [Protected]

### GET /analytics/health
Financial health score. [Protected]

## AI Chat

### POST /chat
```json
{ "message": "How much did I spend this month?" }
```

### GET /chat/history
Get chat history. [Protected]

## Receipts

### POST /receipts/upload
Multipart form with `file` field. [Protected]

## Reports

### GET /reports/list
List all generated reports. [Protected]

### GET /reports/monthly?month=2024-01
Get specific month report. [Protected]

### POST /reports/generate
```json
{ "month": "2024-01" }
```

### GET /health
Health check endpoint.
