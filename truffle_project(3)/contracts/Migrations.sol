// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Migrations {
    address private owner;
    uint private last_completed_migration;

    constructor() {
        owner = msg.sender;
    }

    function setCompleted(uint completed) public {
        require(msg.sender == owner, "Only the owner can set completed migration.");
        require(completed > last_completed_migration, "Migration must be greater than the last completed migration.");
        
        last_completed_migration = completed;
    }

    function getLastCompletedMigration() public view returns (uint) {
        return last_completed_migration;
    }
}
