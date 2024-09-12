"use client"

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import TokenBalanceChart from '@/components/tokenCharts';

import { useState, useEffect } from 'react';


export default function Home() {
  const date = new Date();
  const dateString = date.toLocaleDateString();
  const dateTimeString = date.toLocaleTimeString();

  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [token, setToken] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalValueSol, setTotalValueSol] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getBalance = async () => {
      if (connected && publicKey) {
        setIsLoading(true);
        try {
          const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL + '/?api-key=' + process.env.NEXT_PUBLIC_HELIUS_API_KEY, 'confirmed');
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
          const response = await fetch(`https://api.helius.xyz/v0/addresses/${publicKey}/transactions?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`);
          const data = await response.json();
          setTransactions(data);
          const totalTransactions = data.length;
          setTotalTransactions(totalTransactions);
          const tokenResponse = await fetch(process.env.NEXT_PUBLIC_HELIUS_RPC_URL + '/?api-key=' + process.env.NEXT_PUBLIC_HELIUS_API_KEY, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "id": "",
                "method": "getAssetsByOwner",
                "params": {
                  "ownerAddress": publicKey,
                  "page": 1,
                  "limit": 100,
                  "sortBy": {
                    "sortBy": "created",
                    "sortDirection": "desc"
                  },
                  "options": {
                    "showUnverifiedCollections": false,
                    "showCollectionMetadata": true,
                    "showGrandTotal": true,
                    "showFungible": true,
                    "showNativeBalance": true,
                    "showInscription": false,
                    "showZeroBalance": false
                  }
                }
              }),
          });
          const tokenData = await tokenResponse.json();
          const fungibleTokens = tokenData.result.items.filter(token => token.interface === 'FungibleToken');
          setToken(fungibleTokens);
          //console.log(fungibleTokens);
          
          const solanaPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
          const solanaPriceData = await solanaPrice.json();
          setTotalValueSol(balance/LAMPORTS_PER_SOL * solanaPriceData.solana.usd);
          //console.log(balance/LAMPORTS_PER_SOL * solanaPriceData.solana.usd);

          const totalValue = fungibleTokens.reduce((total, token) => total + token.token_info.price_info.total_price, balance/LAMPORTS_PER_SOL * solanaPriceData.solana.usd);
          setTotalValue(totalValue);
          setIsLoading(false)
          
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
          setTransactions([]);
          setToken([]);
          setIsLoading(false)
        }
      } else {
        setBalance(null);
        setTransactions([]);
        setToken([]);
        setIsLoading(false)
      }
    };

    getBalance();
  }, [connected, publicKey]);

  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading your data...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!connected) {
      return (
        <Card className="mx-4 my-4 h-96 flex flex-col justify-center items-center">
        <CardContent className="flex flex-col items-center p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400 mb-4"
          >
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
            <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
          </svg>
          <p className="text-2xl text-center text-slate-700 font-semibold">
            Connect your wallet to view your analytics
          </p>
        </CardContent>
      </Card>
        
      );
    }

    if (isLoading) {
      return (
        <LoadingScreen />
      );
    }

    const isPortfolioEmpty = token.length === 0 && transactions.length === 0 && totalValueSol === 0;

    if (isPortfolioEmpty) {
      return (
        <Card className="mx-4 my-4 border border-black">
          <CardContent className="flex flex-col items-center justify-center h-96 p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-2xl font-bold text-center">
                Your portfolio is empty
              </CardTitle>
            </CardHeader>
            <p className="text-gray-600 text-center max-w-md">
              It looks like you don't have any tokens or transactions yet. 
              Start by adding some SOL or tokens to your wallet to see your portfolio analytics.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-5 mt-4">
          <Card className="col-span-3 lg:col-span-3 my-2 mx-4 px-4 py-4">
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2">
              <div>
                <p className="text-gray-600">Total Value</p>
                <p className="font-bold text-3xl lg:text-4xl">$ {totalValue.toFixed(2)}</p>
                <p className="mt-4 text-gray-600">Total Transactions</p>
                <p className="font-bold text-3xl lg:text-4xl">{totalTransactions}</p>
              </div>
              <div>
                <TokenBalanceChart tokens={token} solBalance={balance} totalValueSol={totalValueSol} />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-2 my-2 mx-4 px-4 py-4">
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Wallet Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <p className="text-gray-600">Wallet Address</p>
                <p className="font-bold">{publicKey.toString().slice(0, 10)}...{publicKey.toString().slice(-10)}</p>
              </div>
              <div className="mt-4">
                <div className='flex items-center'>
                  <img src="https://solana.com/favicon.ico" alt="Solana" className="w-6 h-6 mr-2" />
                  <p className="text-gray-600">Balance</p>
                </div>
                <p className="font-bold">{balance ? balance.toFixed(3) : 'Loading...'} SOL</p>
              </div>
              <div className="mt-4">
                <p className="text-gray-600">Connected at</p>
                <p className="font-bold">{dateString}, {dateTimeString}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 mt-4">
          <Card className="col-span-3 lg:col-span-3 my-2 mx-4 px-4 py-4">
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] overflow-x-auto overflow-y-auto">
              <Table className="w-full min-w-[1200px]">
                <TableCaption>A list of your recent transactions.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Signature</TableHead>
                    <TableHead className="w-[200px]">Date</TableHead>
                    <TableHead className="w-[100px]">From</TableHead>
                    <TableHead className="w-[200px]">Transaction Type</TableHead>
                    <TableHead className="w-[100px] text-right">Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <a className="hover:text-blue-500 transition duration-200" href={`https://solscan.io/tx/${transaction.signature}`} target="_blank" rel="noopener noreferrer">
                          {transaction.signature.slice(0, 10)}...{transaction.signature.slice(-10)}
                        </a>
                      </TableCell>
                      <TableCell>{new Date(transaction.timestamp * 1000).toLocaleString()}</TableCell>
                      <TableCell>
                        <a className="hover:text-blue-500 transition duration-200" href={`https://solscan.io/account/${transaction.feePayer}`} target="_blank" rel="noopener noreferrer">
                          {transaction.feePayer}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge>{transaction.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          {(transaction.fee / 1_000_000_000).toFixed(6)}
                          <img src="https://solana.com/favicon.ico" alt="Solana" className="w-6 h-6 ml-2" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-2 my-2 mx-4 px-4 py-4">
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Token</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] overflow-y-auto">
              <Table className="w-full min-w-[500px]">
                <TableCaption>A list of your tokens.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Token</TableHead>
                    <TableHead className="w-[80px]">Balance</TableHead>
                    <TableHead className="w-[80px]">Price</TableHead>
                    <TableHead className="text-right w-[100px]">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {token.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={token.content.links.image} alt={token.token_info.symbol} />
                        </Avatar>
                        <p>{token.token_info.symbol}</p>
                      </TableCell>
                      <TableCell>{(token.token_info.balance / Math.pow(10, token.token_info.decimals)).toFixed(2)}</TableCell>
                      <TableCell>$ {(token.token_info.price_info.price_per_token).toFixed(2)}</TableCell>
                      <TableCell className="text-right">$ {(token.token_info.price_info.total_price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen">
      <div className="flex justify-between items-center bg-gray-300 rounded px-4 py-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
        </svg>
        <WalletMultiButton style={{}} />
      </div>
      {renderContent()}
    </main>
  );
}