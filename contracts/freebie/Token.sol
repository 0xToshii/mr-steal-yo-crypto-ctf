// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Farm is ERC20, Ownable
{
    constructor() ERC20("Farm", "FM") {
        _mint(msg.sender, 250000000 * 10 ** decimals());
    }
}