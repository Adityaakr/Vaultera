// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Strategy {
    string public name;
    IERC20 public immutable asset;

    mapping(address => uint256) public vaultDeposits;
    uint256 public totalDeposits;

    event Deposited(address indexed vault, uint256 amount);
    event Withdrawn(address indexed vault, uint256 amount);

    constructor(string memory name_, address asset_) {
        name = name_;
        asset = IERC20(asset_);
    }

    function deposit(uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        vaultDeposits[msg.sender] += amount;
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(vaultDeposits[msg.sender] >= amount, "Strategy: insufficient");
        vaultDeposits[msg.sender] -= amount;
        totalDeposits -= amount;
        asset.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address vault) external view returns (uint256) {
        return vaultDeposits[vault];
    }
}
