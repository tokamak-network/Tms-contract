// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import required modules
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";


// Use SafeERC20 library for IERC20Upgradeable
using SafeERC20Upgradeable for IERC20Upgradeable;

// Define the contract
contract MultiSenderV2 is Initializable, ReentrancyGuardUpgradeable {
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

        // Check if the total amount is greater than zero
        require(_totalAmount > 0, "Total transfer amount is zero");

        // Check if the sender has enough ETH
        require(msg.value == _totalAmount, "Unequal transfer amount");

        // Calculate the failed transaction amount
        uint256 _failedAmount;

        // Store the initial balance of the contract
        uint256 initialBalance = address(this).balance - msg.value;

        // Send ETH to recipients
        for (uint256 i = 0; i < _recipients.length; i++) {
            // Skip the transaction if the amount is zero
            if (_amounts[i] == 0) continue;

            // Check if the recipient is the zero address
            if (_recipients[i] == address(0)) {
                // Accumulate failed transaction amount
                _failedAmount += _amounts[i];
                continue;
            }

            (bool success, ) = payable(_recipients[i]).call{value: _amounts[i]}("");
            if (!success) {
                // Accumulate failed transaction amount
                _failedAmount += _amounts[i];
            }
        }

        // Return the failed amount to the sender
        if (_failedAmount > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: _failedAmount}("");
            require(refundSuccess, "Refund failed");
        }

        // Ensure that the final balance is as expected
        uint256 finalBalance = address(this).balance;
        require(finalBalance == initialBalance, "Balance mismatch after transfers");

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
        uint256 _totalAmount;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _totalAmount += _amounts[i];
        }

        // Check if the total amount is greater than zero
        require(_totalAmount > 0, "Total transfer amount is zero");

        // Create an instance of the ERC20 token contract
        IERC20Upgradeable _token = IERC20Upgradeable(_tokenAddress);

        // Check if the sender has enough tokens
        require(_token.balanceOf(msg.sender) >= _totalAmount, "Not enough tokens");
        _token.safeTransferFrom(msg.sender, address(this), _totalAmount);

        // Send tokens to each recipient
        for (uint256 i = 0; i < _recipients.length; i++) {
            // Check if the recipient is the zero address
            if (_recipients[i] == address(0)) {
                _token.safeTransfer(msg.sender, _amounts[i]);
                continue;
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
}
