#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

/// Storage keys for persistent contract data
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,               // Address of contract admin
    StrategyScore,       // Current strategy score (u32)
    TotalTrades,         // Total number of trades executed (u32)
    LastRefinement,      // Unix timestamp of last refinement (u64)
}

/// Event emitted when strategy is refined
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StrategyRefined {
    pub old_score: u32,
    pub new_score: u32,
    pub timestamp: u64,
    pub admin: Address,
}

/// Main contract struct
#[contract]
pub struct PortfolioAgent;

/// Cooldown period: 1 hour in seconds
const COOLDOWN_PERIOD: u64 = 3600;

/// Score adjustment factors
const POSITIVE_ADJUSTMENT: u32 = 5;  // Increase by 0.5% (5/1000)
const NEGATIVE_ADJUSTMENT: u32 = 3;  // Decrease by 0.3% (3/1000)
const SCORE_SCALE: u32 = 1000;       // Score is stored as integer * 100 (e.g., 870 = 8.70/10)

#[contractimpl]
impl PortfolioAgent {
    /// Initialize the contract with admin and starting metrics
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `admin` - Admin address who can refine strategy
    /// * `initial_score` - Starting strategy score (e.g., 870 for 8.7/10)
    /// * `initial_trades` - Starting trade count (e.g., 1247)
    pub fn initialize(
        env: Env,
        admin: Address,
        initial_score: u32,
        initial_trades: u32,
    ) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        // Require admin authentication
        admin.require_auth();

        // Store initial data
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::StrategyScore, &initial_score);
        env.storage().instance().set(&DataKey::TotalTrades, &initial_trades);
        env.storage().instance().set(&DataKey::LastRefinement, &0u64);

        // Emit initialization event
        env.events().publish(
            (symbol_short!("init"),),
            (admin.clone(), initial_score, initial_trades),
        );
    }

    /// Refine the strategy based on performance metrics
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `caller` - Address attempting to refine (must be admin)
    /// * `performance_metric` - Performance indicator (positive = good, negative = bad)
    /// 
    /// # Panics
    /// * If caller is not admin
    /// * If cooldown period has not elapsed
    pub fn refine_strategy(
        env: Env,
        caller: Address,
        performance_metric: i32,
    ) -> u32 {
        // Authenticate caller
        caller.require_auth();

        // Verify caller is admin
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        
        if caller != admin {
            panic!("Only admin can refine strategy");
        }

        // Check cooldown period
        let current_time = env.ledger().timestamp();
        let last_refinement: u64 = env.storage().instance()
            .get(&DataKey::LastRefinement)
            .unwrap_or(0);

        if current_time < last_refinement + COOLDOWN_PERIOD {
            let remaining = (last_refinement + COOLDOWN_PERIOD) - current_time;
            panic!("Cooldown active: {} seconds remaining", remaining);
        }

        // Get current score
        let old_score: u32 = env.storage().instance()
            .get(&DataKey::StrategyScore)
            .expect("Strategy score not found");

        // Calculate new score based on performance metric
        let new_score = Self::calculate_new_score(old_score, performance_metric);

        // Update storage
        env.storage().instance().set(&DataKey::StrategyScore, &new_score);
        env.storage().instance().set(&DataKey::LastRefinement, &current_time);

        // Increment trade count (refinement represents a strategic decision)
        let total_trades: u32 = env.storage().instance()
            .get(&DataKey::TotalTrades)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalTrades, &(total_trades + 1));

        // Emit event
        env.events().publish(
            (symbol_short!("refined"),),
            StrategyRefined {
                old_score,
                new_score,
                timestamp: current_time,
                admin: caller.clone(),
            },
        );

        new_score
    }

    /// Get current contract metrics (read-only)
    /// 
    /// # Returns
    /// Tuple of (strategy_score, total_trades, last_refinement_timestamp, admin)
    pub fn get_metrics(env: Env) -> (u32, u32, u64, Address) {
        let score: u32 = env.storage().instance()
            .get(&DataKey::StrategyScore)
            .unwrap_or(0);
        
        let trades: u32 = env.storage().instance()
            .get(&DataKey::TotalTrades)
            .unwrap_or(0);
        
        let last_ref: u64 = env.storage().instance()
            .get(&DataKey::LastRefinement)
            .unwrap_or(0);
        
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");

        (score, trades, last_ref, admin)
    }

    /// Get current strategy score only (read-only)
    pub fn get_score(env: Env) -> u32 {
        env.storage().instance()
            .get(&DataKey::StrategyScore)
            .unwrap_or(0)
    }

    /// Get seconds until next refinement is allowed (read-only)
    pub fn get_cooldown_remaining(env: Env) -> u64 {
        let current_time = env.ledger().timestamp();
        let last_refinement: u64 = env.storage().instance()
            .get(&DataKey::LastRefinement)
            .unwrap_or(0);

        let next_allowed = last_refinement + COOLDOWN_PERIOD;
        
        if current_time >= next_allowed {
            0
        } else {
            next_allowed - current_time
        }
    }

    /// Internal: Calculate new score based on performance metric
    /// 
    /// Algorithm:
    /// - Positive metric: Increase score by POSITIVE_ADJUSTMENT per 1000 points
    /// - Negative metric: Decrease score by NEGATIVE_ADJUSTMENT per 1000 points
    /// - Score clamped between 0 and 1000
    fn calculate_new_score(current_score: u32, performance_metric: i32) -> u32 {
        let adjustment = if performance_metric > 0 {
            // Positive performance - increase score
            let increase = (performance_metric.abs() as u32)
                .saturating_mul(POSITIVE_ADJUSTMENT)
                .saturating_div(SCORE_SCALE);
            current_score.saturating_add(increase)
        } else if performance_metric < 0 {
            // Negative performance - decrease score
            let decrease = (performance_metric.abs() as u32)
                .saturating_mul(NEGATIVE_ADJUSTMENT)
                .saturating_div(SCORE_SCALE);
            current_score.saturating_sub(decrease)
        } else {
            // Zero metric - no change
            current_score
        };

        // Clamp between 0 and 1000
        adjustment.min(1000)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        env.mock_all_auths();

        // Initialize with score 870 (8.7/10) and 1247 trades
        client.initialize(&admin, &870, &1247);

        let (score, trades, last_ref, stored_admin) = client.get_metrics();
        
        assert_eq!(score, 870);
        assert_eq!(trades, 1247);
        assert_eq!(last_ref, 0);
        assert_eq!(stored_admin, admin);
    }

    #[test]
    #[should_panic(expected = "Contract already initialized")]
    fn test_cannot_reinitialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);
        client.initialize(&admin, &900, &2000); // Should panic
    }

    #[test]
    fn test_refine_strategy_positive() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // Positive performance metric should increase score
        let new_score = client.refine_strategy(&admin, &100);
        
        // Score should increase slightly (870 + (100 * 5 / 1000) = 870 + 0 = 870)
        // Due to integer division, small metrics won't affect score
        assert!(new_score >= 870);
    }

    #[test]
    fn test_refine_strategy_large_positive() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // Large positive metric
        let new_score = client.refine_strategy(&admin, &10000);
        
        // 870 + (10000 * 5 / 1000) = 870 + 50 = 920
        assert_eq!(new_score, 920);
        
        let (score, trades, _, _) = client.get_metrics();
        assert_eq!(score, 920);
        assert_eq!(trades, 1248); // Incremented
    }

    #[test]
    fn test_refine_strategy_negative() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // Large negative metric
        let new_score = client.refine_strategy(&admin, &-10000);
        
        // 870 - (10000 * 3 / 1000) = 870 - 30 = 840
        assert_eq!(new_score, 840);
    }

    #[test]
    #[should_panic(expected = "Cooldown active")]
    fn test_cooldown_enforcement() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // First refinement should succeed
        client.refine_strategy(&admin, &1000);

        // Second refinement without time passing should fail
        client.refine_strategy(&admin, &1000);
    }

    #[test]
    fn test_cooldown_passes() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // First refinement
        client.refine_strategy(&admin, &1000);

        // Advance time by 1 hour
        env.ledger().with_mut(|li| li.timestamp = 3600);

        // Second refinement should now succeed
        let new_score = client.refine_strategy(&admin, &1000);
        assert!(new_score > 870);
    }

    #[test]
    #[should_panic(expected = "Only admin can refine strategy")]
    fn test_non_admin_cannot_refine() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let hacker = Address::generate(&env);
        
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // Non-admin trying to refine should panic
        client.refine_strategy(&hacker, &1000);
    }

    #[test]
    fn test_get_cooldown_remaining() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        client.initialize(&admin, &870, &1247);

        // Initially, no cooldown
        assert_eq!(client.get_cooldown_remaining(), 0);

        // After refinement, cooldown should be active
        client.refine_strategy(&admin, &1000);
        let remaining = client.get_cooldown_remaining();
        assert!(remaining > 0 && remaining <= 3600);

        // After time passes, cooldown should decrease
        env.ledger().with_mut(|li| li.timestamp = 1800); // 30 minutes
        let remaining_half = client.get_cooldown_remaining();
        assert!(remaining_half < remaining);
        assert!(remaining_half > 0);

        // After full hour, no cooldown
        env.ledger().with_mut(|li| li.timestamp = 3600);
        assert_eq!(client.get_cooldown_remaining(), 0);
    }

    #[test]
    fn test_score_clamping() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PortfolioAgent);
        let client = PortfolioAgentClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        env.mock_all_auths();

        // Start with high score
        client.initialize(&admin, &990, &1247);

        // Massive positive metric should clamp at 1000
        client.refine_strategy(&admin, &100000);
        assert_eq!(client.get_score(), 1000);

        // Advance time
        env.ledger().with_mut(|li| li.timestamp = 3600);

        // Massive negative metric should not go below 0
        client.refine_strategy(&admin, &-1000000);
        assert_eq!(client.get_score(), 0);
    }
}
