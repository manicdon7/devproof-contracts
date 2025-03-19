const { ethers } = require("hardhat");

async function main() {
  try {
    // Get network details
    const network = await ethers.provider.getNetwork();
    console.log("Connected to network:", network.name, "chainId:", network.chainId);

    // Get the contract address from command line arguments or use default
    const contractAddress = process.argv[2] || "0x665cbba08eF854F342A3E3F4B7470d6B0807943E";
    console.log("Checking contract at address:", contractAddress);

    // Get the bytecode at the address
    const bytecode = await ethers.provider.getCode(contractAddress);
    
    // Check if the contract exists (bytecode length > 2 - "0x")
    if (bytecode.length > 2) {
      console.log("Contract exists at the address!");
      console.log("Bytecode length:", bytecode.length);
      console.log("First 64 chars of bytecode:", bytecode.slice(0, 64));
    } else {
      console.log("No contract found at this address. The address might be wrong or the contract is not deployed on this network.");
    }

    // Get signer balance
    const [signer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Signer address:", signer.address);
    console.log("Signer balance:", ethers.formatEther(balance), "ETH");

  } catch (error) {
    console.error("Error checking contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  }); 