pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RevertERC20 is ERC20 {
    constructor() ERC20("Failing ERC20", "FAIL") {
        _mint(msg.sender, 100000000 * (10 ** decimals()));
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        revert();
    }
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        revert();
    }
}
