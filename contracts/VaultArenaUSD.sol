// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaultArenaUSD is ERC20 {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    IERC20 public immutable usdc;
    address public immutable owner;

    mapping(address => bool) public minters;

    event USDCDeposited(address indexed user, uint256 amount);
    event USDCRedeemed(address indexed user, uint256 amount);
    event MinterUpdated(address indexed minter, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "vaUSD: not owner");
        _;
    }

    constructor(address usdc_) ERC20("VaultArena USD", "vaUSD") {
        owner = msg.sender;
        usdc = IERC20(usdc_);
    }

    /// Direct mint for testnet use — anyone can mint up to the cap
    function mint(uint256 amount) external {
        require(totalSupply() + amount <= MAX_SUPPLY, "vaUSD: cap exceeded");
        _mint(msg.sender, amount);
    }

    /// Wrap USDC -> vaUSD 1:1. Caller must approve this contract first.
    function depositUSDC(uint256 amount) external {
        require(amount > 0, "vaUSD: zero");
        usdc.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
        emit USDCDeposited(msg.sender, amount);
    }

    /// Unwrap vaUSD -> USDC 1:1. Burns vaUSD, returns USDC.
    function redeemForUSDC(uint256 amount) external {
        require(amount > 0 && balanceOf(msg.sender) >= amount, "vaUSD: insufficient");
        _burn(msg.sender, amount);
        usdc.transfer(msg.sender, amount);
        emit USDCRedeemed(msg.sender, amount);
    }

    /// Mint vaUSD to a user — callable only by authorized minters (vault contracts)
    function mintFor(address to, uint256 amount) external {
        require(minters[msg.sender], "vaUSD: not minter");
        require(totalSupply() + amount <= MAX_SUPPLY, "vaUSD: cap exceeded");
        _mint(to, amount);
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterUpdated(minter, true);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterUpdated(minter, false);
    }
}
