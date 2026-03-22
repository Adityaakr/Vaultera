// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;

    constructor() ERC20("USD Coin", "USDC") {}

    function mint(uint256 amount) external {
        require(totalSupply() + amount <= MAX_SUPPLY, "MockUSDC: cap exceeded");
        _mint(msg.sender, amount);
    }
}
