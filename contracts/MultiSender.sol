// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import required modules
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Define the contract
contract MultiSender is Initializable {
    // Initialize the contract
    function initialize() public initializer {}

    // Event definitions
    event SendETH(address[] recipients, uint256[] amounts);
    event SendERC20(address token, address[] recipients, uint256[] amounts);

    // Function to send ETH to multiple recipients
    function sendETH(address[] calldata _recipients, uint256[] calldata _amounts) external payable {
        // Check if the lengths of recipients and amounts arrays are equal
        require(_recipients.length == _amounts.length, "Must have the same length");

        // Calculate the total amount to be sent
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        // Check if the sender has enough ETH
        require(msg.value == totalAmount, "Unequal transfer amount");

        // Send ETH to recipients
        for (uint256 i = 0; i < _recipients.length; i++) {
            payable(_recipients[i]).transfer(_amounts[i]);
        }

        // Emit the SendETH event
        emit SendETH(_recipients, _amounts);
    }

    // Function to send ERC20 tokens to multiple recipients
    function sendERC20(
        address _token,
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external payable {
        // Check if the lengths of recipients and amounts arrays are equal
        require(_recipients.length == _amounts.length, "Must have the same length");

        // Calculate the total amount to be sent
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        // Create an instance of the ERC20 token contract
        IERC20Upgradeable token = IERC20Upgradeable(_token);

        // Check if the sender has enough tokens
        require(token.balanceOf(msg.sender) >= totalAmount, "Not enough tokens");

        // Send tokens to each recipient
        for (uint256 i = 0; i < _recipients.length; i++) {
            token.transferFrom(msg.sender, _recipients[i], _amounts[i]);
        }

        // Emit the SendERC20 event
        emit SendERC20(_token, _recipients, _amounts);
    }
}
