# Portfolio Agent - Soroban Smart Contract

Self-refining autonomous strategy management smart contract for Stellar blockchain.

## Overview

This Soroban smart contract manages the autonomous decision-making logic for the Portfolio Agent. It stores strategy metrics, enforces cooldown periods, and allows the admin to refine the trading strategy based on performance.

## Features

✅ **Persistent State Management**
- Strategy score (0-1000, representing 0.0-10.0/10)
- Total trades executed
- Last refinement timestamp
- Admin address

✅ **Strategy Refinement with Cooldown**
- Admin-only `refine_strategy` function
- 1-hour (3600 seconds) cooldown between refinements
- Performance-based score adjustments
- Event emission on every refinement

✅ **Security**
- Admin authentication required
- Cooldown enforcement prevents spam
- Score clamping (0-1000) prevents overflow

✅ **Read-Only Query Functions**
- `get_metrics()` - Returns all contract state
- `get_score()` - Returns current strategy score
- `get_cooldown_remaining()` - Returns seconds until next refinement allowed

## Contract Functions

### `initialize(admin, initial_score, initial_trades)`
Initialize the contract with starting values.

**Parameters:**
- `admin: Address` - Admin who can refine strategy
- `initial_score: u32` - Starting score (e.g., 870 = 8.7/10)
- `initial_trades: u32` - Starting trade count (e.g., 1247)

**Example:**
```rust
client.initialize(&admin_address, &870, &1247);
```

### `refine_strategy(caller, performance_metric)`
Refine the strategy based on performance.

**Parameters:**
- `caller: Address` - Must be admin
- `performance_metric: i32` - Positive = increase score, negative = decrease

**Returns:** New strategy score

**Panics if:**
- Caller is not admin
- Less than 1 hour since last refinement

**Example:**
```rust
// Positive performance - increase score
let new_score = client.refine_strategy(&admin, &10000);

// Negative performance - decrease score
let new_score = client.refine_strategy(&admin, &-5000);
```

### `get_metrics()`
Get all contract metrics (read-only).

**Returns:** `(strategy_score, total_trades, last_refinement_timestamp, admin)`

**Example:**
```rust
let (score, trades, last_ref, admin) = client.get_metrics();
```

### `get_score()`
Get current strategy score only (read-only).

**Returns:** `u32` - Current score

### `get_cooldown_remaining()`
Get seconds until next refinement is allowed (read-only).

**Returns:** `u64` - Seconds remaining (0 if ready)

## Score Calculation Algorithm

```
if performance_metric > 0:
    adjustment = (metric * 5 / 1000)
    new_score = current_score + adjustment
else if performance_metric < 0:
    adjustment = (|metric| * 3 / 1000)
    new_score = current_score - adjustment

new_score = clamp(new_score, 0, 1000)
```

**Examples:**
- Current: 870, Metric: +10000 → New: 920 (870 + 50)
- Current: 870, Metric: -10000 → New: 840 (870 - 30)

## Events

### `StrategyRefined`
Emitted every time strategy is refined.

**Fields:**
- `old_score: u32`
- `new_score: u32`
- `timestamp: u64`
- `admin: Address`

## Building

```bash
cd contracts/portfolio-agent
cargo build --target wasm32-unknown-unknown --release
```

## Testing

```bash
cargo test
```

### Test Coverage

✅ **Initialization Tests**
- Basic initialization
- Prevent re-initialization

✅ **Refinement Tests**
- Positive performance metrics
- Negative performance metrics
- Large metric changes
- Score clamping at boundaries

✅ **Cooldown Tests**
- Enforcement within 1 hour
- Success after cooldown
- Cooldown remaining calculation

✅ **Security Tests**
- Non-admin cannot refine
- Admin authentication required

## Gas Optimization

Contract is optimized for Soroban efficiency:
- ✅ Uses `u32` instead of `u64` where possible
- ✅ Minimizes storage reads/writes
- ✅ Saturating arithmetic prevents panics
- ✅ Release profile optimized for size (`opt-level = "z"`)
- ✅ LTO enabled for dead code elimination

## Deployment

1. Build the contract:
```bash
soroban contract build
```

2. Deploy to testnet:
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/portfolio_agent.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

3. Initialize:
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_SECRET_KEY> \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --initial_score 870 \
  --initial_trades 1247
```

## Integration with Frontend

The React frontend can interact with this contract using `@stellar/stellar-sdk`:

```typescript
import * as StellarSdk from '@stellar/stellar-sdk';

// Get current metrics
const { result } = await server.getContractData(
  contractId,
  StellarSdk.xdr.ScVal.scvSymbol('get_metrics')
);

// Refine strategy
const tx = new StellarSdk.TransactionBuilder(account, {})
  .addOperation(
    StellarSdk.Operation.invokeContractFunction({
      contract: contractId,
      function: 'refine_strategy',
      args: [
        StellarSdk.nativeToScVal(adminAddress, { type: 'address' }),
        StellarSdk.nativeToScVal(performanceMetric, { type: 'i32' })
      ]
    })
  )
  .build();
```

## License

MIT
