# FinSightAI Database Documentation

## Platform: Firebase Firestore (NoSQL)

All data is stored in Firestore collections. No SQL databases are used.

## Collections

### users
```
uid (document ID, auto-generated from email)
fullName: string
email: string (unique)
passwordHash: string (bcrypt)
createdAt: string (ISO datetime)
lastLogin: string (ISO datetime)
```

### transactions
```
transactionId (auto-generated)
userId: string (ref: users)
type: string ("income" | "expense")
amount: number
category: string
description: string
date: string (YYYY-MM-DD)
createdAt: string (ISO datetime)
```

### budgets
```
budgetId (auto-generated)
userId: string (ref: users)
category: string
monthlyLimit: number
createdAt: string (ISO datetime)
```

### savingsGoals
```
goalId (auto-generated)
userId: string (ref: users)
goalName: string
targetAmount: number
currentAmount: number
deadline: string (YYYY-MM-DD)
createdAt: string (ISO datetime)
```

### chatHistory
```
chatId (auto-generated)
userId: string (ref: users)
message: string
role: string ("user" | "assistant")
provider: string ("gemini" | "openrouter" | null)
timestamp: string (ISO datetime)
```

### aiReports
```
reportId (auto-generated)
userId: string (ref: users)
month: string (YYYY-MM)
reportContent: string (markdown)
provider: string ("gemini" | "openrouter")
generatedAt: string (ISO datetime)
```

## Security Rules
Firestore security rules should enforce:
- Users can only read/write their own documents
- Admin operations require admin role
- Rate limiting on auth endpoints
