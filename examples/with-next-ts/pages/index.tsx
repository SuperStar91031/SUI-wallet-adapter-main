import type {NextPage} from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {ChangeEventHandler, useEffect, useState} from "react";
import {useWallet} from "@mysten/wallet-adapter-react";
import {WalletAdapter} from "@mysten/wallet-adapter-base";
import {suietAdapter, supportedWallets} from "./_app";
import * as tweetnacl from 'tweetnacl'

function WalletSelector(props: {
  value: string;
  supportedWallets: { adapter: WalletAdapter }[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
}) {
  const {value, supportedWallets, onChange} = props;
  return (
    <select value={value} onChange={onChange}>
      <option value={""} disabled>
        please select a wallet
      </option>
      {supportedWallets.map((wallet) => {
        const {name} = wallet.adapter;
        return (
          <option key={name} value={name}>
            {name}
          </option>
        );
      })}
    </select>
  );
}

const Home: NextPage = () => {

  const {
    select,
    wallet,
    connected,
    connecting,
    disconnect,
    getAccounts,
    executeMoveCall,
  } = useWallet();

  const [walletName, setWalletName] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState<Uint8Array | undefined>();

  function handleConnect() {
    select(walletName);
  }

  function handleDisconnect() {
    setWalletName("");
    disconnect();
  }

  async function handleExecuteMoveCall() {
    try {
      const data = {
        packageObjectId: "0x2",
        module: "devnet_nft",
        function: "mint",
        typeArguments: [],
        arguments: [
          "name",
          "capy",
          "https://cdn.britannica.com/94/194294-138-B2CF7780/overview-capybara.jpg?w=800&h=450&c=crop",
        ],
        gasBudget: 10000,
      }
      const resData = await executeMoveCall(data);
      console.log('executeMoveCall success', resData)
      alert('executeMoveCall succeeded (see response in the console)')
    } catch (e) {
      console.error('executeMoveCall failed', e)
      alert('executeMoveCall failed (see response in the console)')
    }
  }

  async function handleSignMsg() {
    try {
      const msg = 'Hello world!'
      const result = await suietAdapter.signMessage({
        message: new TextEncoder().encode('Hello world')
      })
      console.log('send message to be signed', msg)
      const textDecoder = new TextDecoder()
      console.log('signMessage success', result)
      console.log('signMessage signature', result.signature)
      console.log('signMessage signedMessage', textDecoder.decode(result.signedMessage).toString())
      const publicKey = await suietAdapter.getPublicKey();
      console.log('public key', publicKey)
      const isCorrect = tweetnacl.sign.detached.verify(
        result.signedMessage,
        result.signature,
        publicKey,
      )
      if (!isCorrect) {
        alert('signMessage succeeded, but verify failed (see response in the console)')
        return
      }
      alert('signMessage succeeded, verify passed (see response in the console)')
    } catch (e) {
      console.error('signMessage failed', e)
      alert('signMessage failed (see response in the console)')
    }
  }

  useEffect(() => {
    if (!wallet) return;
    if (wallet.adapter && !walletName) {
      setWalletName(wallet.adapter.name);
    }
  }, [wallet]);

  useEffect(() => {
    if (!connected) {
      setAccounts([]);
      setPublicKey(undefined)
      return;
    }
    (async function () {
      const result = await getAccounts();
      setAccounts(result);
      const publicKey = await suietAdapter.getPublicKey();
      setPublicKey(publicKey)
    })();
  }, [connected]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to
        </h1>
        <h1 className={styles.title}>
          <a href="https://nextjs.org">Suiet Wallet Adapter Playground!</a>
        </h1>

        <p>Start editing to see some magic happen!</p>
        <div>
          <WalletSelector
            supportedWallets={supportedWallets}
            value={walletName}
            onChange={(evt) => setWalletName(evt.target.value)}
          />
          <button
            style={{margin: "0px 4px"}}
            disabled={!walletName}
            onClick={() => {
              if (!connected) handleConnect();
              else handleDisconnect();
            }}
          >
            {connecting ? "connecting" : connected ? "Disconnect" : "connect"}
          </button>

          {connected && (
            <div style={{margin: "8px 0"}}>
              <button onClick={handleExecuteMoveCall}>executeMoveCall</button>
              <button style={{marginLeft: '8px'}} onClick={handleSignMsg}>Sign Message</button>
            </div>
          )}
        </div>
        <div>
          <p>current wallet: {wallet ? wallet.adapter.name : "null"}</p>
          <p>
            wallet status:{" "}
            {connecting
              ? "connecting"
              : connected
                ? "connected"
                : "disconnected"}
          </p>
          <p>wallet accounts: {JSON.stringify(accounts)}</p>
          <p>account public key: {publicKey}</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16}/>
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
