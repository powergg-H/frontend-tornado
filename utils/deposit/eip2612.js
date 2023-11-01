const { ethers } = require("ethers")
require("dotenv").config()

const getStandardErc2612PermitData =  async function (domainSeparator, owner, spender, amount, nonce) {
    const permitHash = ethers.keccak256(Buffer.from("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"))

    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 60
    const structHash = ethers.keccak256(
        abiCoder.encode(["bytes32", "address", "address", "uint256", "uint256", "uint256"],
            [
                permitHash,
                owner.address,
                spender,
                amount,
                nonce,
                deadline
            ]
        )
    )


    const data = `0x${[
        "0x19",
        "0x01",
        domainSeparator,
        structHash
    ].map((hex) => hex.slice(2)).join("")}`;

    const hash = ethers.keccak256(data);

    //use privatekey to sign message
    // const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC)
    const signerSigningKey = new ethers.SigningKey(owner.privateKey)
    console.log(signerSigningKey,"signerSigningKey")
    const sig = signerSigningKey.sign(hash)

    //const hashArray = ethers.toUtf8Bytes(hash)
    // const signerSigningKey = new ethers.SigningKey(owner.privateKey)
    // const sig = signerSigningKey.signDigest(hashArray)
    const { v, r, s } = ethers.Signature.from(sig)
    const encodedParam = abiCoder.encode(["address", "address", "uint256", "uint256", "uint8", "bytes32", "bytes32"],
        [
            owner.address,
            spender,
            amount,
            deadline,
            v,
            r,
            s,
        ]
    )

    return encodedParam;
}

const getNonStandardErc2612PermitData =  async function (domainSeparator, owner, spender, nonce, allowed) {

        const abiCoder = ethers.AbiCoder.defaultAbiCoder();

        const permitHash = ethers.keccak256(Buffer.from("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)"));

        const expiry = Math.floor(new Date().getTime() / 1000) + 60 * 60

        const structHash = ethers.keccak256(
            abiCoder.encode(["bytes32", "address", "address", "uint256", "uint256", "bool"],
                [
                    permitHash,
                    owner.address,
                    spender,
                    nonce,
                    expiry,
                    allowed
                ]
            )
        )

        const data = `0x${[
            "0x19",
            "0x01",
            domainSeparator,
            structHash
        ].map((hex) => hex.slice(2)).join("")}`;

        const hash = ethers.keccak256(data);

        const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC)
        const signerSigningKey = new ethers.SigningKey(wallet.privateKey)
        const sig = signerSigningKey.sign(hash)
        //signDigest
        //const sig = await owner.signMessage(hash)
        //const sig = await owner.signMessage(ethers.toUtf8Bytes(hash))
        const { v, r, s } = ethers.Signature.from(sig)
            const encodedParam = abiCoder.encode(["address", "address", "uint256", "uint256", "bool", "uint8", "bytes32", "bytes32"],
            [
                owner.address,
                spender,
                nonce,
                expiry,
                allowed,
                v,
                r,
                s,
            ]
        )
        return encodedParam;
}

const getSig = async function (chainID, noGasAddress, tokenAddress, permit, signer, exchangeTokenAmount, exchangeEthMinLimit, gasAmount) {
    const data = `0x${[
        "0x19",
        "0x00",
        ethers.zeroPadValue(ethers.toBeHex(chainID), 32),
        noGasAddress,
        tokenAddress,
        permit,
        signer.address,
        ethers.zeroPadValue(ethers.toBeHex(exchangeTokenAmount), 32),
        ethers.zeroPadValue(ethers.toBeHex(exchangeEthMinLimit), 32),
        ethers.zeroPadValue(ethers.toBeHex(gasAmount), 32),
    ].map((hex) => hex.slice(2)).join("")}`;

    const hash = ethers.keccak256(data);

    return await signer.signMessage(ethers.getBytes(hash))
}

module.exports = {
    getStandardErc2612PermitData,
    getNonStandardErc2612PermitData,
    getSig
}
