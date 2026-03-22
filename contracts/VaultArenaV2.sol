// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function balanceOf(address vault) external view returns (uint256);
}

interface IArena {
    function openRound(uint256 stake, string calldata position) external returns (uint256);
    function acceptRound(uint256 roundId, uint256 stake, string calldata position) external;
}

interface IVaultArenaUSD {
    function mintFor(address to, uint256 amount) external;
}

contract VaultArenaV2 is ERC20 {
    IERC20 public immutable usdc;
    IERC20 public immutable vausd;
    address public immutable owner;
    address public agent;

    uint256 public constant HBAR_PRICE = 89e15; // $0.089 in 18-decimal USD

    uint256 public totalHbarWei;

    mapping(address => uint256) public strategyDeposits;
    address[] public strategies;
    uint256 public totalInStrategies;

    event Deposited(address indexed user, uint256 usdValue, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 usdValue);
    event StrategyAllocated(address indexed strategy, uint256 amount);
    event StrategyDeallocated(address indexed strategy, uint256 amount);
    event ArenaEntered(address indexed arena, uint256 roundId, uint256 stake);
    event AgentAction(address indexed agent, string action, string reason);

    modifier onlyAgent() {
        require(msg.sender == agent, "VaultArenaV2: not agent");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "VaultArenaV2: not owner");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address usdc_,
        address vausd_,
        address agent_
    ) ERC20(name_, symbol_) {
        owner = msg.sender;
        usdc = IERC20(usdc_);
        vausd = IERC20(vausd_);
        agent = agent_;
    }

    receive() external payable {
        totalHbarWei += msg.value;
    }

    // ─── User: Multi-asset deposit ───────────────────────────────────

    function deposit(uint256 usdcAmount, uint256 vausdAmount) external payable {
        uint256 usdValue = 0;

        if (msg.value > 0) {
            totalHbarWei += msg.value;
            usdValue += (msg.value * HBAR_PRICE) / 1e18;
        }
        if (usdcAmount > 0) {
            usdc.transferFrom(msg.sender, address(this), usdcAmount);
            usdValue += usdcAmount;
            // Auto-mint vaUSD 1:1 to the depositor
            try IVaultArenaUSD(address(vausd)).mintFor(msg.sender, usdcAmount) {} catch {}
        }
        if (vausdAmount > 0) {
            vausd.transferFrom(msg.sender, address(this), vausdAmount);
            usdValue += vausdAmount;
        }

        require(usdValue > 0, "VaultArenaV2: zero deposit");

        uint256 shares;
        uint256 supply = totalSupply();
        uint256 currentTVL = tvl();

        if (supply == 0 || currentTVL == 0) {
            shares = usdValue;
        } else {
            shares = (usdValue * supply) / currentTVL;
        }

        _mint(msg.sender, shares);
        emit Deposited(msg.sender, usdValue, shares);
    }

    // ─── User: Withdraw (0=USDC, 1=vaUSD, 2=HBAR) ───────────────────

    function withdraw(uint256 shares, uint8 tokenChoice) external {
        require(shares > 0 && balanceOf(msg.sender) >= shares, "VaultArenaV2: bad shares");

        uint256 usdValue = (shares * tvl()) / totalSupply();
        _burn(msg.sender, shares);

        if (tokenChoice == 0) {
            require(usdc.balanceOf(address(this)) >= usdValue, "VaultArenaV2: low USDC");
            usdc.transfer(msg.sender, usdValue);
        } else if (tokenChoice == 1) {
            require(vausd.balanceOf(address(this)) >= usdValue, "VaultArenaV2: low vaUSD");
            vausd.transfer(msg.sender, usdValue);
        } else {
            uint256 hbarAmount = (usdValue * 1e18) / HBAR_PRICE;
            require(totalHbarWei >= hbarAmount, "VaultArenaV2: low HBAR");
            totalHbarWei -= hbarAmount;
            (bool ok, ) = payable(msg.sender).call{value: hbarAmount}("");
            require(ok, "VaultArenaV2: HBAR xfer failed");
        }

        emit Withdrawn(msg.sender, shares, usdValue);
    }

    // ─── Agent: Strategy allocation (USDC only for simplicity) ───────

    function allocateToStrategy(address strategy, uint256 amount) external onlyAgent {
        require(usdc.balanceOf(address(this)) >= amount, "VaultArenaV2: low idle USDC");
        usdc.approve(strategy, amount);
        IStrategy(strategy).deposit(amount);
        strategyDeposits[strategy] += amount;
        totalInStrategies += amount;
        _trackStrategy(strategy);
        emit StrategyAllocated(strategy, amount);
    }

    function deallocateFromStrategy(address strategy, uint256 amount) external onlyAgent {
        require(strategyDeposits[strategy] >= amount, "VaultArenaV2: over-dealloc");
        IStrategy(strategy).withdraw(amount);
        strategyDeposits[strategy] -= amount;
        totalInStrategies -= amount;
        emit StrategyDeallocated(strategy, amount);
    }

    // ─── Agent: Arena ────────────────────────────────────────────────

    function openArenaRound(address arena, uint256 stake, string calldata position) external onlyAgent returns (uint256) {
        require(usdc.balanceOf(address(this)) >= stake, "VaultArenaV2: low USDC for arena");
        usdc.approve(arena, stake);
        uint256 roundId = IArena(arena).openRound(stake, position);
        emit ArenaEntered(arena, roundId, stake);
        return roundId;
    }

    function acceptArenaRound(address arena, uint256 roundId, uint256 stake, string calldata position) external onlyAgent {
        require(usdc.balanceOf(address(this)) >= stake, "VaultArenaV2: low USDC for arena");
        usdc.approve(arena, stake);
        IArena(arena).acceptRound(roundId, stake, position);
        emit ArenaEntered(arena, roundId, stake);
    }

    function executeAction(string calldata action, string calldata reason) external onlyAgent {
        emit AgentAction(msg.sender, action, reason);
    }

    function setAgent(address newAgent) external onlyOwner {
        agent = newAgent;
    }

    // ─── Views ───────────────────────────────────────────────────────

    function tvl() public view returns (uint256) {
        uint256 hbarUSD = (totalHbarWei * HBAR_PRICE) / 1e18;
        uint256 usdcBal = usdc.balanceOf(address(this));
        uint256 vausdBal = vausd.balanceOf(address(this));
        return hbarUSD + usdcBal + vausdBal + totalInStrategies;
    }

    function idleBalance() external view returns (uint256) {
        uint256 hbarUSD = (totalHbarWei * HBAR_PRICE) / 1e18;
        return hbarUSD + usdc.balanceOf(address(this)) + vausd.balanceOf(address(this));
    }

    function strategyBalance(address strategy) external view returns (uint256) {
        return strategyDeposits[strategy];
    }

    function getStrategies() external view returns (address[] memory) {
        return strategies;
    }

    function _trackStrategy(address strategy) internal {
        for (uint i = 0; i < strategies.length; i++) {
            if (strategies[i] == strategy) return;
        }
        strategies.push(strategy);
    }
}
