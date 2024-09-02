// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import required modules
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Use SafeERC20 library for IERC20Upgradeable
using SafeERC20Upgradeable for IERC20Upgradeable;

// Define custom errors
error InvalidLength();
error InsufficientBalance();
error TransferFailed();
error ZeroAddress();
error UnequalTransferAmount();
error BalanceMismatch();

// Define the contract
contract MultiSender is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    // Initialize the contract
    function initialize() public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
    }
    // Event definitions
    event SendETH(address[] recipients, uint256[] amounts);
    event SendERC20(address token, address[] recipients, uint256[] amounts);
    event RescueERC20(address token, address recipient, uint256 amount);

    // Function to send ETH to multiple recipients
    function sendETH(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external payable nonReentrant {
        // Check if the lengths of recipients and amounts arrays are equal
        if (_recipients.length != _amounts.length) {
            revert InvalidLength();
        }

        // Calculate the total amount to be sent
        uint256 _totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _totalAmount += _amounts[i];
        }

        // Check if the total amount is greater than zero
        if (_totalAmount == 0) {
            revert InsufficientBalance();
        }

        // Check if the sender has enough ETH
        if (msg.value != _totalAmount) {
            revert UnequalTransferAmount();
        }

        // Store the initial balance of the contract
        uint256 initialBalance = address(this).balance - msg.value;

        // Send ETH to recipients
        for (uint256 i = 0; i < _recipients.length; i++) {
            // Skip the transaction if the amount is zero
            if (_amounts[i] == 0) continue;

            // Check if the recipient is the zero address
            if (_recipients[i] == address(0)) {
                revert ZeroAddress();
            }

            (bool success, ) = payable(_recipients[i]).call{value: _amounts[i]}("");
            if (!success) {
                revert TransferFailed();
            }
        }

        // Ensure that the final balance is as expected
        uint256 finalBalance = address(this).balance;
        if (finalBalance != initialBalance) {
            revert BalanceMismatch();
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
        if (_recipients.length != _amounts.length) {
            revert InvalidLength();
        }

        // Calculate the total amount to be sent
        uint256 _totalAmount;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _totalAmount += _amounts[i];
        }

        // Check if the total amount is greater than zero
        if (_totalAmount == 0) {
            revert InsufficientBalance();
        }

        // Create an instance of the ERC20 token contract
        IERC20Upgradeable _token = IERC20Upgradeable(_tokenAddress);

        _token.safeTransferFrom(msg.sender, address(this), _totalAmount);

        // Send tokens to each recipient
        for (uint256 i = 0; i < _recipients.length; i++) {
            // Check if the recipient is the zero address
            if (_recipients[i] == address(0)) {
                revert ZeroAddress();
            }

            // Skip the transaction if the amount is zero
            if (_amounts[i] == 0) {
                continue;
            }

            _token.safeTransfer(_recipients[i], _amounts[i]);
        }

        // Emit the SendERC20 event
        emit SendERC20(_tokenAddress, _recipients, _amounts);
    }

    // Function to rescue stuck ERC20 tokens, only accessible by the owner
    function rescueERC20(address _token, address _recipient) public onlyOwner {
        IERC20Upgradeable token = IERC20Upgradeable(_token);
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(_recipient, balance);
        emit RescueERC20(_token, _recipient, balance);
    }
}
