# Credits System Documentation

## Overview

The credits system manages user credits for YouTube video analysis. Each analysis costs 1 credit, and new users receive 20 free credits upon signup.

## API Endpoints

### Get Credit Balance
```
GET /api/credits/
```

**Authentication:** Required (session cookie)

**Response:**
```json
{
  "balance": 15
}
```

**Errors:**
- `401`: User not authenticated
- `500`: Server error

---

### Consume Credits
```
POST /api/credits/consume/
```

**Authentication:** Required (session cookie)

**Request Body:**
```json
{
  "amount": 1,
  "reference": "optional_reference_string"
}
```

**Response (200 OK):**
```json
{
  "balance": 14
}
```

**Errors:**
- `400`: Invalid amount (must be positive integer)
- `401`: User not authenticated
- `402`: Insufficient credits
```json
{
  "error": "Insufficient credits: 14 < 15"
}
```
- `500`: Server error

---

### Top Up Credits (Admin Only)
```
POST /api/credits/topup/
```

**Authentication:** Admin user required

**Request Body:**
```json
{
  "user_id": 123,
  "amount": 10,
  "reference": "payment_invoice_123"
}
```

Or use email instead of user_id:
```json
{
  "user_email": "user@example.com",
  "amount": 10,
  "reference": "payment_invoice_123"
}
```

**Response (200 OK):**
```json
{
  "user_id": 123,
  "user_email": "user@example.com",
  "new_balance": 25
}
```

**Errors:**
- `400`: Missing required fields or invalid amount
- `401`: Not authenticated
- `403`: Not admin user
- `404`: User not found
- `500`: Server error

---

### Get Credit History
```
GET /api/credits/history/
```

**Authentication:** Required (session cookie)

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "amount": -1,
      "transaction_type": "ANALYSIS",
      "reference": "video_analysis_https://youtube.com/watch?v=...",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "amount": 20,
      "transaction_type": "INIT",
      "reference": "signup_bonus",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 2,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Errors:**
- `401`: User not authenticated
- `500`: Server error

---

### Get User Credit History (Admin Only)
```
GET /api/credits/admin/history/
```

**Authentication:** Admin user required

**Query Parameters:**
- `user_id` or `user_email`: User identifier (required)
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:** Same as user history but includes user info:
```json
{
  "user_id": 123,
  "user_email": "user@example.com",
  "transactions": [...],
  "pagination": {...}
}
```

---

## Transaction Types

| Type | Description | Amount |
|------|-------------|--------|
| `INIT` | Initial credits given to new users | +20 |
| `ANALYSIS` | Credits consumed for video analysis | -1 |
| `RESERVED` | Credits reserved for async analysis | -1 |
| `REFUND` | Credits refunded (failed analysis, etc.) | +1 |
| `TOPUP` | Credits added via payment/admin | +N |
| `ADMIN_ADJUST` | Manual credit adjustments by admin | ±N |

## Payment Webhook Specification

For payment provider integration, use the `/api/credits/topup/` endpoint with proper authentication:

### Webhook Request Format
```json
{
  "user_email": "customer@example.com",
  "amount": 25,
  "reference": "stripe_payment_intent_pi_123",
  "metadata": {
    "payment_provider": "stripe",
    "product_id": "credits_25"
  }
}
```

### Authentication
- Use HTTP Basic Auth with admin credentials
- Or implement signature verification (HMAC-SHA256) for webhook security
- Include `X-Signature` header with webhook signature

### Security Headers
```http
Content-Type: application/json
X-Signature: sha256=abc123...
Authorization: Basic YWRtaW46c2VjcmV0
```

## Database Schema

### CreditAccount Model
```python
class CreditAccount(models.Model):
    user = OneToOneField(User)
    balance = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### CreditTransaction Model
```python
class CreditTransaction(models.Model):
    user = ForeignKey(User)
    amount = IntegerField()
    transaction_type = CharField(choices=TRANSACTION_TYPES)
    reference = CharField(max_length=100, blank=True, null=True)
    created_at = DateTimeField(auto_now_add=True)
```

## Business Logic

### New User Signup
- Automatic creation of `CreditAccount` with 20 credits
- Creates `INIT` transaction with reference "signup_bonus"

### Analysis Flow
1. User requests analysis via `/api/analysis/url/`
2. Backend atomically consumes 1 credit using `select_for_update()`
3. If credit consumption succeeds, proceed with analysis
4. If analysis fails, automatically refund 1 credit
5. Return analysis result with updated credit balance

### Credit Safety
- All credit operations use database transactions
- `select_for_update()` prevents race conditions
- Negative balances are never allowed
- Automatic refunds on analysis failures

## Error Handling

### Insufficient Credits (402)
```json
{
  "error": "Insufficient credits. You need at least 1 credit to run an analysis."
}
```

### Invalid Amount (400)
```json
{
  "error": "Amount must be a positive integer"
}
```

### User Not Found (404)
```json
{
  "error": "User not found"
}
```

## Rate Limiting

Recommended rate limits:
- `/api/credits/consume/`: 10 requests per minute per user
- `/api/credits/topup/`: 5 requests per minute per admin
- `/api/credits/history/`: 30 requests per minute per user

## Admin Actions

Django admin provides bulk credit adjustments:
- Select multiple users
- Choose "Add credits" or "Remove credits" action
- Specify amount and reason
- System creates `ADMIN_ADJUST` transactions

## Testing

### Unit Tests
```python
def test_initial_credits():
    user = User.objects.create_user('test@example.com')
    account = user.credit_account
    assert account.balance == 20
    assert CreditTransaction.objects.filter(
        user=user, 
        transaction_type='INIT', 
        amount=20
    ).exists()

def test_consume_credits():
    user = User.objects.create_user('test@example.com')
    initial_balance = get_credit_balance(user)
    new_balance = consume_credits(user, amount=5)
    assert new_balance == initial_balance - 5

def test_insufficient_credits():
    user = User.objects.create_user('test@example.com')
    # Set balance to 0
    user.credit_account.balance = 0
    user.credit_account.save()
    
    with pytest.raises(InsufficientCreditsError):
        consume_credits(user, amount=1)
```

### Concurrency Test
```python
def test_concurrent_consumption():
    user = User.objects.create_user('test@example.com')
    user.credit_account.balance = 1
    user.credit_account.save()
    
    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(consume_credits, user, 1) 
            for _ in range(10)
        ]
        for future in futures:
            try:
                results.append(future.result())
            except InsufficientCreditsError:
                results.append(None)
    
    # Only one should succeed
    successful_results = [r for r in results if r is not None]
    assert len(successful_results) == 1
    assert successful_results[0] == 0
```

## Monitoring

Track these metrics:
- Total credits consumed per day
- Average credits per user
- Failed credit operations
- Refund rate
- Payment conversion rate

## Security Considerations

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Admin-only endpoints protected by user permissions
3. **Atomicity**: Database transactions prevent partial updates
4. **Validation**: Input validation for all parameters
5. **Rate Limiting**: Prevent abuse of credit operations
6. **Audit Trail**: All transactions logged with references

## Integration Examples

### JavaScript/TypeScript
```typescript
import { getCreditBalance, consumeCredits } from '@/lib/credits';

// Check balance
const balance = await getCreditBalance();
console.log(`Current balance: ${balance} credits`);

// Consume credits
try {
  const newBalance = await consumeCredits(1);
  console.log(`New balance: ${newBalance} credits`);
} catch (error) {
  if (error.message.includes('Insufficient credits')) {
    // Redirect to top-up page
    window.location.href = '/topup';
  }
}
```

### Python
```python
from youtube_analytics.credit_utils import get_credit_balance, consume_credits

# Get balance
balance = get_credit_balance(user)
print(f"Current balance: {balance} credits")

# Consume credits
try:
    new_balance = consume_credits(user, amount=1)
    print(f"New balance: {new_balance} credits")
except InsufficientCreditsError:
    print("Insufficient credits")
```

## Troubleshooting

### Common Issues

1. **User has no credits**: Check if credit account was created on signup
2. **Negative balance**: This should never happen - investigate database integrity
3. **Missing transactions**: Check if signal handlers are properly connected
4. **Race conditions**: Ensure `select_for_update()` is used in all credit operations

### Debug Commands

```python
# Check user's credit account
user = User.objects.get(email='user@example.com')
account = user.credit_account
print(f"Balance: {account.balance}")

# Check recent transactions
transactions = user.credit_transactions.all()[:10]
for t in transactions:
    print(f"{t.transaction_type}: {t.amount} ({t.created_at})")

# Manually add credits (emergency)
from youtube_analytics.credit_utils import add_credits
add_credits(user, 10, 'ADMIN_ADJUST', 'emergency_fix')
```
