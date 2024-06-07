// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import required modules
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// Use SafeERC20 library for IERC20Upgradeable
using SafeERC20 for IERC20Upgradeable;

// Define the contract
contract MultiSender is Initializable, ReentrancyGuardUpgradeable {
    // Initialize the contract
    function initialize() public initializer {
        __ReentrancyGuard_init();
    }

    // Event definitions
    event SendETH(address[] recipients, uint256[] amounts);
    event SendERC20(address token, address[] recipients, uint256[] amounts);

    // Function to send ETH to multiple recipients
    function sendETH(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external payable nonReentrant {
        // Check if the lengths of recipients and amounts arrays are equal
        require(_recipients.length == _amounts.length, "Must have the same length");

        // Calculate the total amount to be sent
        uint256 _totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _totalAmount += _amounts[i];
        }

        // Check if the sender has enough ETH
        require(msg.value == _totalAmount, "Unequal transfer amount");

        // Send ETH to recipients
        for (uint256 i = 0; i < _recipients.length; i++) {
            (bool success, ) = payable(_recipients[i]).call{value: _amounts[i]}("");
            require(success, "Transfer failed");
        }

        // Emit the SendETH event
        emit SendETH(_recipients, _amounts);
    }

    // Function to send ERC20 tokens to multiple recipients
    function sendERC20(
        address _tokenAddress,
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external nonReentrant {
        // Check if the lengths of recipients and amounts arrays are equal
        require(_recipients.length == _amounts.length, "Must have the same length");

        // Calculate the total amount to be sent
        uint256 _totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _totalAmount += _amounts[i];
        }

        // Create an instance of the ERC20 token contract
        IERC20Upgradeable _token = IERC20Upgradeable(_tokenAddress);

        // Check if the sender has approved the contract to spend the tokens
        require(
            _token.allowance(msg.sender, address(this)) >= _totalAmount,
            "Transfer not approved"
        );

        // Check if the sender has enough tokens
        require(_token.balanceOf(msg.sender) >= _totalAmount, "Not enough tokens");

        // Send tokens to each recipient
        for (uint256 i = 0; i < _recipients.length; i++) {
            _token.transferFrom(msg.sender, _recipients[i], _amounts[i]);
        }

        // Emit the SendERC20 event
        emit SendERC20(_tokenAddress, _recipients, _amounts);
    }
}
