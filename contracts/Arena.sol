// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Arena {
    IERC20 public immutable usdc;
    address public immutable owner;

    struct Round {
        address vaultA;
        address vaultB;
        uint256 stakeA;
        uint256 stakeB;
        string positionA;
        string positionB;
        uint8 status; // 0 = open, 1 = active (both entered), 2 = resolved
        address winner;
        uint256 payout;
    }

    Round[] public rounds;
    uint256 public protocolFees;

    event RoundOpened(uint256 indexed roundId, address indexed vaultA, uint256 stake, string position);
    event RoundAccepted(uint256 indexed roundId, address indexed vaultB, uint256 stake, string position);
    event RoundResolved(uint256 indexed roundId, address indexed winner, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "Arena: not owner");
        _;
    }

    constructor(address usdc_, address owner_) {
        usdc = IERC20(usdc_);
        owner = owner_;
    }

    function openRound(uint256 stake, string calldata position) external returns (uint256 roundId) {
        require(stake > 0, "Arena: zero stake");
        usdc.transferFrom(msg.sender, address(this), stake);

        roundId = rounds.length;
        rounds.push(Round({
            vaultA: msg.sender,
            vaultB: address(0),
            stakeA: stake,
            stakeB: 0,
            positionA: position,
            positionB: "",
            status: 0,
            winner: address(0),
            payout: 0
        }));

        emit RoundOpened(roundId, msg.sender, stake, position);
    }

    function acceptRound(uint256 roundId, uint256 stake, string calldata position) external {
        Round storage r = rounds[roundId];
        require(r.status == 0, "Arena: not open");
        require(msg.sender != r.vaultA, "Arena: same vault");
        require(stake > 0, "Arena: zero stake");

        usdc.transferFrom(msg.sender, address(this), stake);
        r.vaultB = msg.sender;
        r.stakeB = stake;
        r.positionB = position;
        r.status = 1;

        emit RoundAccepted(roundId, msg.sender, stake, position);
    }

    function resolveRound(uint256 roundId, address winner) external onlyOwner {
        Round storage r = rounds[roundId];
        require(r.status == 1, "Arena: not active");
        require(winner == r.vaultA || winner == r.vaultB, "Arena: invalid winner");

        uint256 totalPot = r.stakeA + r.stakeB;
        uint256 payout = (totalPot * 90) / 100;
        uint256 fee = totalPot - payout;

        r.status = 2;
        r.winner = winner;
        r.payout = payout;
        protocolFees += fee;

        usdc.transfer(winner, payout);
        emit RoundResolved(roundId, winner, payout);
    }

    function roundCount() external view returns (uint256) {
        return rounds.length;
    }

    function getRound(uint256 roundId) external view returns (
        address vaultA, address vaultB,
        uint256 stakeA, uint256 stakeB,
        string memory positionA, string memory positionB,
        uint8 status, address winner, uint256 payout
    ) {
        Round storage r = rounds[roundId];
        return (r.vaultA, r.vaultB, r.stakeA, r.stakeB,
                r.positionA, r.positionB, r.status, r.winner, r.payout);
    }
}
