### The jpeg-sniper ctf has three contract
- LaunchpegErrors.
It is a contract that contains custom error function.
The error keyword allows dev to define custom error types and use them in contracts.
It is used with revert.
It is imported in the other contract to handle errors.

- BaseLaunchpegNFT.
It is an nft contract (erc721).with other functionality added (e.g. A function to send back excess funds in a case whereby the user sent more than the require amount)

- FlatLaunchpeg
it imported the `BaseLaunchpegNFT` contract. This is the main contract that users will interact with.
It is used to manage mint, phase and other functionality derived from BaseLaunchpegNFT contract.

There is a modifier called `isEOA` which is attached to the publicSaleMint function used to check if the user sending the message is a contract address or an Externally owned Account(EOA).

So, they are trying to prevent contract from minting.

I realised that there is a bug with the `isEOA modifier`, that can allow a contract to mint.

here is the isEOA modifier.

```solidity
    modifier isEOA() {
        uint256 size;
        address sender = msg.sender;

        assembly {
            size := extcodesize(sender)
        }

        if (size > 0) revert Launchpeg__Unauthorized();
        _;
    }
```

the `extcodesize` is an assembly code, it is used to check for the size of the code of an address

`extcodesize(sender)` returns the code size of the (sender)

basically
extcodesize(contract) will be greater than zero because it contains code

while
extcodesize(EOA) will always return 0 because there is no code in it.

so, is size > 0 it will revert. which basically is if it's a contract revert. but the bug here is a contract that has been self-destruct will return 0 and the code size will be 0, but there is possibility for code to be deployed to the same address. I once read an article on that when i was researching on create2. the articles talks about it and it reference a github repo which i cloned. you can check it out [here ](https://github.com/Ultra-Tech-code/metamorphic).

another hack. the extcodesize of a contract during deployment is zero until it's succesfully created. When i  makes a call to the `publicSaleMint` function in the `FlatLaunchpeg` in the constructor. the check fails because the contract does not have source code during construction and `extcodesize(sender)` is zero because it's not yet created.


### How i implement my hacks. 

I Created an attacker  contract that has an attack function. The attack function takes in the address of the attacker and other necessary parameter. I used create2 to create contract that mint the nft and push the address to an array.

In the constructor of `Attacker` contract the `attack` function is called.  The `attack` function create another contract `Mint`. In the `Mint` constuctor  the `FlatLaunchpeg` Contract `publicSaleMint` function is called, so the `extcodesize(sender)` checks fails and the attacker was able to mint nft. and i also called the `setApprovalForAll` function passing the address of the attacker so that the attacker can transfer the nft after all the nft have been minted succsefully.

I did some calculation to determine the lenght of the `Mint` contract to be deployed and the amount of nft to be minted by each contract.

check the `deploy.ts` file in the scripts folder.


#### Changes that i propose
use `require(tx.origin == msg.sender);` to check for only EOA, because `tx.origin` is always an EOA(transaction initiator). It compares the tranaction initiator with current caller. here, the tx.origin will be the EOA(Attcaker) but the `msg.sender `will be the `Attacker` contract. so this will prevent contract from minting.

or 
We can use a whitelising method whereby all the addresses that will be minting would have been whitelisted.
here is an [example ](https://github.com/Ultra-Tech-code/ERC20-Token-Airdrop-With-merkleTree)

There is no check for the `quantity`,  so a user can passed in 0. - put a check  there
The `_refundIfOver(total);` function should have been called before  `_mintForUser(msg.sender, _quantity);`

### To run the script.
There is a scripts folder that has `deploy.ts` file. The `deploy.ts` file shows the walkthrough of the attack in details.

- To run the script
```bash
npx hardhat run scripts/deploy.ts
```

### To run the test
There is a test folder that has `1-jpeg-sniper.ts` file. The `1-jpeg-sniper.ts` file is the test file for the `FlatLaunchpeg` contract. 

- To run the test
```bash
npx hardhat test test/1-jpeg-sniper.ts
```