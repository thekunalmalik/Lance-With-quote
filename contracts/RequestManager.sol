// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Projects.sol";

contract Escrow {
    address public freelancer;
    address public employer;
    uint public amount;

    constructor(address _freelancer, address _employer, uint _amount) payable {
        freelancer = _freelancer;
        employer = _employer;
        amount = _amount;
    }

    function releaseFunds() external {
        require(msg.sender == employer, "Only the employer can release funds");
        payable(freelancer).transfer(amount);
    }
}

contract RequestManager {

    Projects public projectsContract;

    enum RequestStatus { Pending, Accepted, Rejected }
    enum QuotationStatus { Pending, Proposed, Negotiating, Accepted, Rejected }

    struct Request {
        uint projectId;
        address freelancer;
        uint freelancerRating;
        RequestStatus status;
        Escrow escrowContract;
    }

    struct Quotation {
        uint projectId;
        address proposedBy; // freelancer or employer address
        uint proposedAmount;
        string description;
        string negotiationNotes;
        QuotationStatus status;
        uint timestamp;
    }

    mapping(uint => Request) public requests;
    mapping(uint => Quotation[]) public quotations; // projectId => array of quotations
    mapping(uint => address) public assignedFreelancer; // projectId => freelancer address (for quick lookup)

    event RequestSent(uint projectId, address freelancer);
    event RequestAccepted(uint projectId, address freelancer, address escrowContract);
    event RequestRejected(uint projectId, address freelancer);
    event QuotationProposed(uint projectId, address proposedBy, uint amount);
    event QuotationCounterProposed(uint projectId, address proposedBy, uint amount, string notes);
    event QuotationAccepted(uint projectId, uint newAmount);
    event QuotationRejected(uint projectId);

    constructor(address _projectsContract) {
        projectsContract = Projects(_projectsContract);
    }

    function sendRequest(uint _projectId, uint _freelancerRating) public {
        require(_projectId > 0 && _projectId <= projectsContract.projectCount(), "Invalid project ID");
        (,, , , Projects.Status status, , ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project is not open");

        requests[_projectId] = Request({
            projectId: _projectId,
            freelancer: msg.sender,
            freelancerRating: _freelancerRating,
            status: RequestStatus.Pending,
            escrowContract: Escrow(address(0))
        });

        emit RequestSent(_projectId, msg.sender);
    }

    function acceptRequest(uint _projectId) public payable {
        require(requests[_projectId].freelancer != address(0), "No request exists for this project");
        require(requests[_projectId].status == RequestStatus.Pending, "Request already processed");

        (, , , uint reward, Projects.Status status, address employer, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project must be open");
        require(msg.sender == employer, "Only the employer can accept this request");
        require(msg.value == reward, "Incorrect reward amount sent");

        // Create new escrow contract instance with freelancer and employer details
        Escrow escrow = new Escrow{value: reward}(requests[_projectId].freelancer, employer, reward);
        requests[_projectId].escrowContract = escrow;

        requests[_projectId].status = RequestStatus.Accepted;
        
        // Mark freelancer as assigned
        assignedFreelancer[_projectId] = requests[_projectId].freelancer;
        
        // NOTE: Removed projectsContract.closeProject() call due to authorization issues
        // The project status should be managed separately or the contract should be redesigned
        
        emit RequestAccepted(_projectId, requests[_projectId].freelancer, address(escrow));
    }

    function rejectRequest(uint _projectId) public {
        require(requests[_projectId].freelancer != address(0), "No request exists for this project");
        require(requests[_projectId].status == RequestStatus.Pending, "Request already processed");

        (, , , , Projects.Status status, address employer, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project must be open");
        require(msg.sender == employer, "Only the employer can reject this request");

        requests[_projectId].status = RequestStatus.Rejected;
        emit RequestRejected(_projectId, requests[_projectId].freelancer);
    }

    function proposeQuotation(uint _projectId, uint _proposedAmount, string memory _description) public {
        require(_projectId > 0 && _projectId <= projectsContract.projectCount(), "Invalid project ID");
        require(_proposedAmount > 0, "Amount must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        (,,,, Projects.Status status, address employer, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project is not open for quotations");
        
        // New workflow: Any freelancer can propose, employer can counter-offer
        // Removed restriction on who can propose since system now allows direct proposals

        Quotation memory newQuotation = Quotation({
            projectId: _projectId,
            proposedBy: msg.sender,
            proposedAmount: _proposedAmount,
            description: _description,
            negotiationNotes: "",
            status: QuotationStatus.Proposed,
            timestamp: block.timestamp
        });

        quotations[_projectId].push(newQuotation);
        emit QuotationProposed(_projectId, msg.sender, _proposedAmount);
    }

    function counterPropose(uint _projectId, uint _newAmount, string memory _notes) public {
        require(_projectId > 0 && _projectId <= projectsContract.projectCount(), "Invalid project ID");
        require(_newAmount > 0, "Amount must be greater than 0");
        require(quotations[_projectId].length > 0, "No quotations exist for this project");
        
        (,,,uint reward, Projects.Status status, address employer, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project is not open for negotiation");
        
        Quotation[] storage projQuotations = quotations[_projectId];
        uint lastIdx = projQuotations.length - 1;
        Quotation storage lastQuotation = projQuotations[lastIdx];
        
        // Counter offer must come from the other party
        if (lastQuotation.proposedBy == requests[_projectId].freelancer) {
            require(msg.sender == employer, "Only employer can counter-offer on freelancer's proposal");
        } else {
            require(msg.sender == requests[_projectId].freelancer, "Only freelancer can counter-offer on employer's proposal");
        }
        
        lastQuotation.status = QuotationStatus.Negotiating;
        lastQuotation.proposedAmount = _newAmount;
        lastQuotation.negotiationNotes = _notes;
        
        emit QuotationCounterProposed(_projectId, msg.sender, _newAmount, _notes);
    }

    function acceptQuotation(uint _projectId, uint _quotationIndex) public payable {
        require(_projectId > 0 && _projectId <= projectsContract.projectCount(), "Invalid project ID");
        require(_quotationIndex < quotations[_projectId].length, "Invalid quotation index");
        
        (,,,uint originalReward, Projects.Status status, address employer, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project is not open");
        require(msg.sender == employer, "Only employer can accept quotation");
        
        Quotation storage quotation = quotations[_projectId][_quotationIndex];
        require(quotation.status == QuotationStatus.Proposed || quotation.status == QuotationStatus.Negotiating, "Quotation cannot be accepted");
        require(msg.value == quotation.proposedAmount, "Sent amount must match proposed amount");
        
        quotation.status = QuotationStatus.Accepted;
        
        // Create escrow with new amount
        Escrow escrow = new Escrow{value: quotation.proposedAmount}(requests[_projectId].freelancer, employer, quotation.proposedAmount);
        requests[_projectId].escrowContract = escrow;
        requests[_projectId].status = RequestStatus.Accepted;
        
        assignedFreelancer[_projectId] = requests[_projectId].freelancer;
        
        // NOTE: Removed projectsContract.closeProject() call due to authorization issues
        // The project status should be managed separately or the contract should be redesigned
        // to allow RequestManager to close projects on behalf of the employer
        
        emit QuotationAccepted(_projectId, quotation.proposedAmount);
    }

    function rejectQuotation(uint _projectId, uint _quotationIndex) public {
        require(_projectId > 0 && _projectId <= projectsContract.projectCount(), "Invalid project ID");
        require(_quotationIndex < quotations[_projectId].length, "Invalid quotation index");
        
        (,,,, Projects.Status status, address employer, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project is not open");
        require(msg.sender == employer, "Only employer can reject quotation");
        
        Quotation storage quotation = quotations[_projectId][_quotationIndex];
        quotation.status = QuotationStatus.Rejected;
        
        emit QuotationRejected(_projectId);
    }

    function getQuotations(uint _projectId) public view returns (Quotation[] memory) {
        return quotations[_projectId];
    }

    function getLatestQuotation(uint _projectId) public view returns (Quotation memory) {
        require(quotations[_projectId].length > 0, "No quotations for this project");
        return quotations[_projectId][quotations[_projectId].length - 1];
    }

    function isProjectAssigned(uint _projectId) public view returns (bool) {
        return assignedFreelancer[_projectId] != address(0);
    }

    function getRequest(uint _projectId) public view returns (Request memory) {
        return requests[_projectId];
    }
}
