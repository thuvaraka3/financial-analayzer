import re
from datetime import datetime, timedelta

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_amount(amount):
    try:
        val = float(amount)
        return val >= 0
    except (ValueError, TypeError):
        return False

def parse_date(date_str):
    formats = ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%dT%H:%M:%S']
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def get_month_range(year, month):
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(days=1)
    return start_date, end_date

def sanitize_string(value):
    if not value:
        return ''
    return str(value).strip()

INCOME_CATEGORIES = ['Salary', 'Business', 'Freelancing', 'Investments', 'Allowance', 'Other']
EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Education', 'Entertainment', 'Healthcare', 'Housing', 'Other']

def is_valid_category(category, tx_type):
    if tx_type == 'income':
        return category in INCOME_CATEGORIES
    elif tx_type == 'expense':
        return category in EXPENSE_CATEGORIES
    return False
