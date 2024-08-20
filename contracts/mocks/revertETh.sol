pragma solidity ^0.8.0;

contract RevertETH {
    fallback() external payable {
        revert("No direct ETH transfers allowed");
    }
}
