// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ChallengeBadge is ERC1155, EIP712 {
    bytes32 public constant BADGE_TYPEHASH =
        keccak256("Badge(address claimant,uint256 badgeId,uint256 nonce)");

    address public authority;
    mapping(uint256 => bool) public used;

    constructor(address authority_) ERC1155("") EIP712("MintPassBadges", "1") {
        authority = authority_;
    }

    function claimBadge(address claimant, uint256 badgeId, uint256 nonce, bytes memory sig) external {
        require(!used[nonce], "nonce used");
        require(badgeId == 7 || badgeId == 14 || badgeId == 21, "bad badge id");
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(BADGE_TYPEHASH, claimant, badgeId, nonce)));
        require(ECDSA.recover(digest, sig) == authority, "bad signature");
        used[nonce] = true;
        _mint(claimant, badgeId, 1, "");
    }

    // Soulbound: credencial educacional nao se transfere
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        require(from == address(0) || to == address(0), "soulbound: no transfer");
        super._update(from, to, ids, values);
    }
}
