// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IKlerosLiquid {
    function createDispute(uint256 _numberOfChoices, bytes calldata _extraData) external returns (uint256);
    function getDisputeStatus(uint256 _disputeId) external view returns (uint256);
    function getDisputeResult(uint256 _disputeId) external view returns (uint256);
}

contract KlerosIntegration {
    enum Status { Pending, Disputed, Resolved }
    
    struct Dispute {
        address partyA;
        address partyB;
        Status status;
        uint256 disputeId;
    }

    mapping(uint256 => Dispute) public disputes;
    uint256 public disputeCount;
    address public arbitrator;

    event DisputeCreated(uint256 indexed disputeId, address indexed partyA, address indexed partyB);
    event DisputeRaised(uint256 indexed disputeId);
    event DisputeResolved(uint256 indexed disputeId);

    constructor(address _arbitrator) {
        arbitrator = _arbitrator;
    }

    function raiseDispute(address _partyB) external {
        disputeCount++;
        disputes[disputeCount] = Dispute({
            partyA: msg.sender,
            partyB: _partyB,
            status: Status.Pending,
            disputeId: 0
        });

        // Create a dispute with Kleros
        disputes[disputeCount].disputeId = IKlerosLiquid(arbitrator).createDispute(3, ""); // Assuming 3 choices for the dispute
        disputes[disputeCount].status = Status.Disputed;

        emit DisputeCreated(disputeCount, msg.sender, _partyB);
        emit DisputeRaised(disputeCount);
    }

    function resolveDispute(uint256 _disputeId) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status == Status.Disputed, "Dispute must be disputed to resolve");

        dispute.status = Status.Resolved;
        emit DisputeResolved(_disputeId);
    }

    function checkDisputeStatus(uint256 _disputeId) external view returns (uint256) {
        return IKlerosLiquid(arbitrator).getDisputeStatus(disputes[_disputeId].disputeId);
    }

    function getDisputeResult(uint256 _disputeId) external view returns (uint256) {
        return IKlerosLiquid(arbitrator).getDisputeResult(disputes[_disputeId].disputeId);
    }
}
