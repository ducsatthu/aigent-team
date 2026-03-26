# Test Data Reference

## Factory Pattern

Factories produce valid test objects with sensible defaults. Override only
what matters for each test — this makes tests self-documenting.

### TypeScript Factory (with Faker)

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: Date;
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'member',
    createdAt: faker.date.recent({ days: 30 }),
    ...overrides,
  };
}

// Usage in test:
const admin = buildUser({ role: 'admin' });
const viewer = buildUser({ role: 'viewer', email: 'viewer@test.com' });
```

### Related Object Factories

```typescript
// tests/factories/order.factory.ts
import { faker } from '@faker-js/faker';
import { buildUser } from './user.factory';

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped';
}

export function buildOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  const quantity = overrides.quantity ?? faker.number.int({ min: 1, max: 5 });
  const unitPrice = overrides.unitPrice ?? parseFloat(faker.commerce.price({ min: 5, max: 200 }));
  return {
    sku: faker.string.alphanumeric(8).toUpperCase(),
    name: faker.commerce.productName(),
    quantity,
    unitPrice,
    ...overrides,
  };
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  const items = overrides.items ?? [buildOrderItem(), buildOrderItem()];
  return {
    id: faker.string.uuid(),
    userId: buildUser().id,
    items,
    total: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    status: 'pending',
    ...overrides,
  };
}
```

### Python Factory (with Faker)

```python
# tests/factories/user_factory.py
from dataclasses import dataclass, field
from datetime import datetime
from faker import Faker
from uuid import uuid4

fake = Faker()

@dataclass
class UserFactory:
    id: str = field(default_factory=lambda: str(uuid4()))
    email: str = field(default_factory=fake.email)
    name: str = field(default_factory=fake.name)
    role: str = "member"
    created_at: datetime = field(default_factory=datetime.now)

# Usage:
user = UserFactory()
admin = UserFactory(role="admin")
```

---

## Faker for Realistic Data

### Why Faker Over Hardcoded Values

- Hardcoded values hide implicit assumptions (e.g., "John" assumes ASCII names).
- Faker generates edge cases naturally (long names, special characters, Unicode).
- Deterministic seed for reproducibility:

```typescript
import { faker } from '@faker-js/faker';

// Set seed for reproducible test runs when debugging
faker.seed(12345);
```

### Common Faker Patterns

```typescript
faker.string.uuid()                     // IDs
faker.internet.email()                   // Email addresses
faker.person.fullName()                  // Display names
faker.lorem.paragraph()                  // Long text fields
faker.date.between({ from: '2024-01-01', to: '2024-12-31' }) // Date ranges
faker.number.int({ min: 1, max: 100 })  // Bounded integers
faker.helpers.arrayElement(['a', 'b'])   // Random from set
faker.string.alphanumeric(10)            // Tokens / codes
```

### Avoid

- `faker.lorem.sentence()` for fields with validation (use realistic values).
- Random data for fields your test asserts on (override explicitly).

---

## Database Isolation Strategies

Tests that share a database must not leak state. Choose one strategy:

### 1. Transaction Rollback (fastest)

Wrap each test in a transaction and roll back after. No cleanup needed.

```typescript
// tests/helpers/db.ts
import { db } from '../../src/db';

export async function withTransaction<T>(
  fn: (trx: Transaction) => Promise<T>,
): Promise<T> {
  const trx = await db.transaction();
  try {
    const result = await fn(trx);
    return result;
  } finally {
    await trx.rollback();
  }
}

// In test:
test('creates order', async () => {
  await withTransaction(async (trx) => {
    const order = await createOrder(trx, buildOrder());
    expect(order.status).toBe('pending');
    // Transaction rolls back — no cleanup
  });
});
```

**Caveat**: Does not work if code under test manages its own transactions.

### 2. Truncate Between Tests

Clear all tables before each test. Slower but simpler.

```typescript
// tests/helpers/db.ts
const tables = ['orders', 'order_items', 'users'];

export async function truncateAll() {
  // Disable FK checks, truncate, re-enable — one round trip
  await db.raw(`
    SET session_replication_role = 'replica';
    ${tables.map(t => `TRUNCATE TABLE "${t}" CASCADE;`).join('\n')}
    SET session_replication_role = 'origin';
  `);
}

// vitest.setup.ts
beforeEach(async () => {
  await truncateAll();
});
```

### 3. Unique IDs Per Test (no cleanup)

Each test uses unique identifiers. Data from other tests is invisible
because queries filter by test-specific IDs.

```typescript
test('fetches user orders', async () => {
  const userId = faker.string.uuid(); // unique to this test
  await seedOrder({ userId, status: 'paid' });
  await seedOrder({ userId, status: 'pending' });

  const orders = await getOrdersByUser(userId);
  expect(orders).toHaveLength(2);
  // Other tests' orders are not returned
});
```

Best for read-heavy tests. Does not prevent table bloat in long-running suites.

### Comparison

| Strategy | Speed | Isolation | Complexity |
|---|---|---|---|
| Transaction rollback | Fastest | Strong | Medium (transaction passthrough) |
| Truncate | Slow | Strong | Low |
| Unique IDs | Fast | Partial | Low |

**Recommendation**: Transaction rollback for unit/integration tests. Truncate
for E2E against a real database. Unique IDs as a supplementary technique.

---

## Test Environment Parity

Tests must run against an environment that matches production as closely
as possible.

### Database

- Same engine and version (PostgreSQL 16 in prod = PostgreSQL 16 in test).
- Use Docker Compose or Testcontainers for local/CI parity.
- Never substitute SQLite for PostgreSQL — query behaviour differs.

```typescript
// testcontainers example
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('test')
    .start();
  process.env.DATABASE_URL = container.getConnectionUri();
}, 60_000);

afterAll(async () => {
  await container.stop();
});
```

### External Services

- Mock external APIs with MSW (see `mocking.md`).
- For services you own, use contract tests (see `test-strategy.md`).
- Never call real third-party APIs in automated tests.

### Configuration

- Use a dedicated `.env.test` file. Never share `.env` between dev and test.
- Ensure secrets in test config are test-only credentials, not production keys.
