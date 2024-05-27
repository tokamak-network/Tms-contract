// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MultiSender is Initializable {
    function initialize() public initializer {}

    event SendETH(address token, address[] recipients, uint256[] amounts);
    event SendERC20(address token, address[] recipients, uint256[] amounts);

    function sendETH(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external payable {
        require(
            _recipients.length == _amounts.length,
            "Must have the same length"
        );

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        require(msg.value >= totalAmount, "Not enough ETH");

        // Send ETH
        for (uint256 i = 0; i < _recipients.length; i++) {
            payable(_recipients[i]).transfer(_amounts[i]);
        }

        emit SendETH(address(0), _recipients, _amounts);
    }

    function sendERC20(
        address _token,
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external payable {
        require(
            _recipients.length == _amounts.length,
            "Must have the same length"
        );

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        IERC20Upgradeable token = IERC20Upgradeable(_token);
        require(
            token.balanceOf(msg.sender) >= totalAmount,
            "Not enough tokens"
        );

        // Send ERC20 tokens
        for (uint256 i = 0; i < _recipients.length; i++) {
            token.transferFrom(msg.sender, _recipients[i], _amounts[i]);
        }
        emit SendERC20(_token, _recipients, _amounts);
    }
}
