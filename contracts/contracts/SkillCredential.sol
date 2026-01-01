// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SkillCredential is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialOwner) ERC721("SkillCredential", "SKILL") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    /// @notice Mint a credential NFT to `to` with a tokenURI (expects ipfs://<cid>)
    /// @dev Matches backend's preferred function name: mintCredential(address,string)
    function mintCredential(address to, string calldata tokenURI_) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = tokenURI_;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }
}
