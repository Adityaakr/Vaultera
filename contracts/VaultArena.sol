// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract VaultArena is ERC20 {
    address public immutable owner;
    address public agent;

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    event AgentAction(address indexed agent, string action, string reason);

    modifier onlyAgent() {
        require(msg.sender == agent, "VaultArena: caller is not the agent");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "VaultArena: caller is not the owner");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address agent_
    ) ERC20(name_, symbol_) {
        owner = msg.sender;
        agent = agent_;
    }

    receive() external payable {}

    function deposit() external payable {
        require(msg.value > 0, "VaultArena: zero deposit");
        uint256 shares;
        uint256 supply = totalSupply();
        uint256 balanceBefore = address(this).balance - msg.value;
        if (supply == 0 || balanceBefore == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * supply) / balanceBefore;
        }
        _mint(msg.sender, shares);
        emit Deposited(msg.sender, msg.value, shares);
    }

    function withdraw(uint256 shares) external {
        require(shares > 0, "VaultArena: zero shares");
        require(balanceOf(msg.sender) >= shares, "VaultArena: insufficient shares");
        uint256 amount = (shares * address(this).balance) / totalSupply();
        _burn(msg.sender, shares);
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "VaultArena: transfer failed");
        emit Withdrawn(msg.sender, shares, amount);
    }

    function executeAction(string calldata action, string calldata reason) external onlyAgent {
        emit AgentAction(msg.sender, action, reason);
    }

    function setAgent(address newAgent) external onlyOwner {
        agent = newAgent;
    }

    function tvl() external view returns (uint256) {
        return address(this).balance;
    }

    function sharePrice() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18;
        return (address(this).balance * 1e18) / supply;
    }
}
