import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

const rpc = "https://cosmos-rpc.publicnode.com:443"
const memo = 'urn:cft20:cosmoshub-4@v1;mint$tic=STAKE,amt=420000000';

async function initializeWallets(mnemonics) {
    const walletPromises = mnemonics.map(mnemonic => 
        DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {prefix: 'cosmos'}));

    const wallets = await Promise.all(walletPromises);

    const walletsWithAddress = await Promise.all(wallets.map(async wallet => {
        const [account] = await wallet.getAccounts();
        console.log(`Minted for ${account.address}`);
        return { wallet, address: account.address };
    }));

    return walletsWithAddress;
}

async function mintTokens(address,wallet) {
    const amount = {
        amount: '1',
        denom: 'uatom'
    };

    const fee = {
        amount: [{ denom: "uatom", amount: '600' }],
        gas: '76817',
    }

    const signingClient = await SigningStargateClient.connectWithSigner(rpc, wallet)
  
    const result = await signingClient.sendTokens(
        address, 
        address, 
        [amount], 
        fee,
        memo);
    
    console.log(`[Success] https://www.mintscan.io/cosmos/tx/${result.transactionHash}`)
}

(async ()=>{

    const mnemonics = [
        '1',
        '2',
        '3'
    ];

    console.log('Starting Inscrip for multiple wallets...');

    const walletData = await initializeWallets(mnemonics);

    console.log('')
    let run = true;
    while (run) {
        const promises = walletData.map(({ address, wallet }) =>
            mintTokens(address, wallet).catch(err => {
                const error = JSON.parse(err.message);

                if(error.data == 'tx already exists in cache'){
                    console.error(`[ERROR] tx already exist in Address: ${address}`)
                }else{
                    throw err
                }
            })
        );

        await Promise.all(promises);
    }
})()