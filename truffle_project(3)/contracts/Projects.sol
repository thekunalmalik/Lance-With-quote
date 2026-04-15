// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7;

// import "./RequestManager.sol";

contract Projects {
    
    enum Status { Closed, Open }

    struct Project {
        uint id;
        string name;
        string description;
        uint reward;
        Status status;
        address employer;
    }

    struct Milestone {
        uint id;
        uint projectId;
        string name;
        string description;
        uint daycount;
        uint percentage;
        bool completed;
        string proofFileHash; // To store proof file hash
    }

    mapping(uint => Project) public projects;
    mapping(uint => Milestone[]) public milestones;
    mapping(address => uint) public freelancerRatings; // Map freelancer address to their rating (in basis points out of 5 * 100)

    uint public projectCount;
    uint public milestoneCount;

    // RequestManager public requestManager;

    event ProjectAdded(uint id, string name, address employer);
    event MilestoneAdded(uint projectId, uint milestoneId, string name, uint percentage);
    event MilestoneProofUploaded(uint projectId, uint milestoneId, string proofFileHash);
    // constructor(address _requestManager) {
    //     requestManager = RequestManager(_requestManager);
    // }

    function addProject(string memory _name, string memory _description, uint _reward) public {
        projectCount++;
        projects[projectCount] = Project({
            id: projectCount,
            name: _name,
            description: _description,
            reward: _reward,
            status: Status.Open,
            employer: msg.sender
        });

        emit ProjectAdded(projectCount, _name, msg.sender);
    }

    function addMilestone(uint _projectId, string memory _name, string memory _description, uint _daycount, uint _percentage) public {
        require(_projectId > 0 && _projectId <= projectCount, "Project does not exist");
        require(msg.sender == projects[_projectId].employer, "Only the employer can add milestones");
        require(_percentage > 0 && _percentage <= 100, "Invalid percentage");

        milestoneCount++;
        milestones[_projectId].push(Milestone({
            id: milestoneCount,
            projectId: _projectId,
            name: _name,
            description: _description,
            daycount: _daycount,
            percentage: _percentage,
            completed: false,
            proofFileHash: "" // Initialize proof file hash as empty
        }));

        emit MilestoneAdded(_projectId, milestoneCount, _name, _percentage);
    }

    function uploadMilestoneProof(uint _projectId, uint _milestoneId, address _freelancer, string memory _proofFileHash) public {
        require(_projectId > 0 && _projectId <= projectCount, "Project does not exist");
        require(msg.sender == _freelancer, "Only the assigned freelancer can upload proof");

        // Check if the milestone exists
        require(_milestoneId > 0 && _milestoneId <= milestones[_projectId].length, "Invalid milestone ID");

        // Store the proof file hash for the milestone
        milestones[_projectId][_milestoneId - 1].proofFileHash = _proofFileHash;

        emit MilestoneProofUploaded(_projectId, _milestoneId, _proofFileHash);
    }



    function getFreelancerRating(address _freelancer) public view returns (uint) {
        return freelancerRatings[_freelancer];
    }

    function getProject(uint _id) public view returns (uint, string memory, string memory, uint, Status, address) {
        require(_id > 0 && _id <= projectCount, "Project does not exist");
        Project memory proj = projects[_id];
        return (proj.id, proj.name, proj.description, proj.reward, proj.status, proj.employer);
    }

    function viewProjects() public view returns (
        uint[] memory ids, 
        string[] memory names, 
        string[] memory descriptions, 
        uint[] memory rewards, 
        Status[] memory statuses, 
        address[] memory employers
    ) {
        ids = new uint[](projectCount);
        names = new string[](projectCount);
        descriptions = new string[](projectCount);
        rewards = new uint[](projectCount);
        statuses = new Status[](projectCount);
        employers = new address[](projectCount);

        for (uint i = 1; i <= projectCount; i++) {
            Project storage proj = projects[i];
            ids[i - 1] = proj.id;
            names[i - 1] = proj.name;
            descriptions[i - 1] = proj.description;
            rewards[i - 1] = proj.reward;
            statuses[i - 1] = proj.status;
            employers[i - 1] = proj.employer;
        }

        return (ids, names, descriptions, rewards, statuses, employers);
    }

    function viewOpenProjects() public view returns (
        uint[] memory ids, 
        string[] memory names, 
        string[] memory descriptions, 
        uint[] memory rewards, 
        Status[] memory statuses, 
        address[] memory employers
    ) {
        uint openCount = 0;
        for (uint i = 1; i <= projectCount; i++) {
            if (projects[i].status == Status.Open) {
                openCount++;
            }
        }

        ids = new uint[](openCount);
        names = new string[](openCount);
        descriptions = new string[](openCount);
        rewards = new uint[](openCount);
        statuses = new Status[](openCount);
        employers = new address[](openCount);

        uint index = 0;
        for (uint i = 1; i <= projectCount; i++) {
            if (projects[i].status == Status.Open) {
                Project storage proj = projects[i];
                ids[index] = proj.id;
                names[index] = proj.name;
                descriptions[index] = proj.description;
                rewards[index] = proj.reward;
                statuses[index] = proj.status;
                employers[index] = proj.employer;
                index++;
            }
        }

        return (ids, names, descriptions, rewards, statuses, employers);
    }

    function getMilestones(uint _projectId) 
        public view 
        returns (
            uint[] memory ids, 
            uint[] memory projectIds, 
            string[] memory names, 
            string[] memory descriptions, 
            uint[] memory daycounts, 
            uint[] memory percentages, 
            bool[] memory completions, 
            string[] memory proofFileHashes
        ) 
    {
        require(_projectId > 0 && _projectId <= projectCount, "Project does not exist");

        Milestone[] memory projectMilestones = milestones[_projectId];
        uint milestonesCount = projectMilestones.length;

        // Initialize arrays for each field in Milestone
        ids = new uint[](milestonesCount);
        projectIds = new uint[](milestonesCount);
        names = new string[](milestonesCount);
        descriptions = new string[](milestonesCount);
        daycounts = new uint[](milestonesCount);
        percentages = new uint[](milestonesCount);
        completions = new bool[](milestonesCount);
        proofFileHashes = new string[](milestonesCount);

        // Populate each array with the corresponding data from each milestone
        for (uint i = 0; i < milestonesCount; i++) {
            Milestone memory milestone = projectMilestones[i];
            ids[i] = milestone.id;
            projectIds[i] = milestone.projectId;
            names[i] = milestone.name;
            descriptions[i] = milestone.description;
            daycounts[i] = milestone.daycount;
            percentages[i] = milestone.percentage;
            completions[i] = milestone.completed;
            proofFileHashes[i] = milestone.proofFileHash;
        }

        return (
            ids, 
            projectIds, 
            names, 
            descriptions, 
            daycounts, 
            percentages, 
            completions, 
            proofFileHashes
        );
    }

    function closeProject(uint _id) public {
        require(_id > 0 && _id <= projectCount, "Project does not exist");
        Project storage proj = projects[_id];
        require(msg.sender == proj.employer, "Only the employer can close this project");
        proj.status = Status.Closed;
    }

    function completeMilestone(uint _projectId, uint _milestoneId) public {
        require(_projectId > 0 && _projectId <= projectCount, "Project does not exist");
        require(_milestoneId > 0 && _milestoneId <= milestones[_projectId].length, "Milestone does not exist");
        
        Milestone storage milestone = milestones[_projectId][_milestoneId - 1];
        require(!milestone.completed, "Milestone already completed");
        
        milestone.completed = true; // Mark the milestone as completed
    }

    function setFreelancerRating(address _freelancer, uint _rating) public {
        // Ensure only the owner of the contract can set the rating
        // require(msg.sender == owner, "Only the owner can set the rating"); // Adjust ownership logic as necessary
        freelancerRatings[_freelancer] = _rating;
    }


}
