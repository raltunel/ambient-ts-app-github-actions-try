import ExchangeBalance from '../../components/Portfolio/EchangeBalance/ExchangeBalance';
import PortfolioBanner from '../../components/Portfolio/PortfolioBanner/PortfolioBanner';
import PortfolioTabs from '../../components/Portfolio/PortfolioTabs/PortfolioTabs';
import styles from './Portfolio.module.css';
import { useParams } from 'react-router-dom';
import { getNFTs } from '../../App/functions/getNFTs';
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { fetchAddress } from '../../App/functions/fetchAddress';
import { useMoralis } from 'react-moralis';
import { BigNumber, ethers } from 'ethers';
import { CrocEnv, ChainSpec } from '@crocswap-libs/sdk';
import Modal from '../../components/Global/Modal/Modal';
import { useModal } from '../../components/Global/Modal/useModal';
import { TokenIF } from '../../utils/interfaces/exports';
import Button from '../../components/Global/Button/Button';
import { Erc20TokenBalanceFn, nativeTokenBalanceFn } from '../../App/functions/fetchTokenBalances';
import { useAppSelector } from '../../utils/hooks/reduxToolkit';
import { TokenPriceFn } from '../../App/functions/fetchTokenPrice';
import NotFound from '../NotFound/NotFound';
import ProfileSettings from '../../components/Portfolio/ProfileSettings/ProfileSettings';
import { SoloTokenSelect } from '../../components/Global/TokenSelectContainer/SoloTokenSelect';

const mainnetProvider = new ethers.providers.WebSocketProvider(
    // 'wss://mainnet.infura.io/ws/v3/4a162c75bd514925890174ca13cdb6a2', // benwolski@gmail.com
    // 'wss://mainnet.infura.io/ws/v3/170b7b65781c422d82a94b8b289ca605',
    'wss://mainnet.infura.io/ws/v3/e0aa879e36fc4c9e91b826ad961a36fd',
);
interface PortfolioPropsIF {
    crocEnv: CrocEnv | undefined;
    getAmbientTokens: () => TokenIF[];
    verifyToken: (addr: string, chn: string) => boolean;
    getTokensByName: (searchName: string, chn: string, exact: boolean) => TokenIF[];
    getTokenByAddress: (addr: string, chn: string) => TokenIF | undefined;
    isTokenABase: boolean;
    provider: ethers.providers.Provider | undefined;
    cachedFetchNativeTokenBalance: nativeTokenBalanceFn;
    cachedFetchErc20TokenBalances: Erc20TokenBalanceFn;
    cachedFetchTokenPrice: TokenPriceFn;
    ensName: string;
    lastBlockNumber: number;
    connectedAccount: string;
    userImageData: string[];
    chainId: string;
    tokensOnActiveLists: Map<string, TokenIF>;
    selectedOutsideTab: number;
    setSelectedOutsideTab: Dispatch<SetStateAction<number>>;
    outsideControl: boolean;
    setOutsideControl: Dispatch<SetStateAction<boolean>>;
    userAccount?: boolean;
    openGlobalModal: (content: React.ReactNode, title?: string) => void;
    closeGlobalModal: () => void;
    openModalWallet: () => void;
    importedTokens: TokenIF[];
    chainData: ChainSpec;

    setImportedTokens: Dispatch<SetStateAction<TokenIF[]>>;
    currentPositionActive: string;
    setCurrentPositionActive: Dispatch<SetStateAction<string>>;
    account: string;
    showSidebar: boolean;
    isUserLoggedIn: boolean | undefined;
    isAuthenticated: boolean;
    baseTokenBalance: string;
    quoteTokenBalance: string;
    baseTokenDexBalance: string;
    quoteTokenDexBalance: string;
    handlePulseAnimation: (type: string) => void;

    currentTxActiveInTransactions: string;
    setCurrentTxActiveInTransactions: Dispatch<SetStateAction<string>>;
    gasPriceInGwei: number | undefined;
}

export default function Portfolio(props: PortfolioPropsIF) {
    const {
        crocEnv,
        getAmbientTokens,
        getTokensByName,
        getTokenByAddress,
        verifyToken,
        isTokenABase,
        provider,
        cachedFetchNativeTokenBalance,
        cachedFetchErc20TokenBalances,
        cachedFetchTokenPrice,
        ensName,
        lastBlockNumber,
        userImageData,
        connectedAccount,
        chainId,
        tokensOnActiveLists,
        openGlobalModal,
        closeGlobalModal,
        userAccount,
        outsideControl,
        setOutsideControl,
        selectedOutsideTab,
        setSelectedOutsideTab,
        importedTokens,
        setImportedTokens,
        isAuthenticated,
        baseTokenBalance,
        quoteTokenBalance,
        baseTokenDexBalance,
        quoteTokenDexBalance,
        currentTxActiveInTransactions,
        setCurrentTxActiveInTransactions,
        showSidebar,
        isUserLoggedIn,
        handlePulseAnimation,
        gasPriceInGwei,
        openModalWallet,
    } = props;
    const { isInitialized } = useMoralis();

    const selectedToken: TokenIF = useAppSelector((state) => state.temp.token);

    const [tokenAllowance, setTokenAllowance] = useState<string>('');
    const [recheckTokenAllowance, setRecheckTokenAllowance] = useState<boolean>(false);
    const [recheckTokenBalances, setRecheckTokenBalances] = useState<boolean>(false);

    const [tokenWalletBalance, setTokenWalletBalance] = useState<string>('');
    const [tokenDexBalance, setTokenDexBalance] = useState<string>('');

    const selectedTokenAddress = selectedToken.address;
    const selectedTokenDecimals = selectedToken.decimals;

    useEffect(() => {
        if (crocEnv && selectedToken.address && connectedAccount) {
            crocEnv
                .token(selectedToken.address)
                .wallet(connectedAccount)
                .then((bal: BigNumber) => setTokenWalletBalance(bal.toString()))
                .catch(console.log);
            crocEnv
                .token(selectedToken.address)
                .balance(connectedAccount)
                .then((bal: BigNumber) => {
                    setTokenDexBalance(bal.toString());
                })
                .catch(console.log);
        }
        setRecheckTokenBalances(false);
    }, [crocEnv, selectedToken.address, connectedAccount, lastBlockNumber, recheckTokenBalances]);

    useEffect(() => {
        (async () => {
            if (crocEnv && connectedAccount && selectedTokenAddress) {
                try {
                    const allowance = await crocEnv
                        .token(selectedTokenAddress)
                        .allowance(connectedAccount);
                    setTokenAllowance(allowance.toString());
                    // setTokenAllowance(toDisplayQty(allowance, selectedTokenDecimals));
                } catch (err) {
                    console.log(err);
                }
                setRecheckTokenAllowance(false);
            }
        })();
    }, [crocEnv, selectedTokenAddress, lastBlockNumber, connectedAccount, recheckTokenAllowance]);

    const { address } = useParams();

    const isAddressEns = address?.endsWith('.eth');
    const isAddressHex = address?.startsWith('0x') && address?.length == 42;

    if (address && !isAddressEns && !isAddressHex) return <NotFound />;
    // if (address && !isAddressEns && !isAddressHex) return <Navigate replace to='/404' />;

    const [resolvedAddress, setResolvedAddress] = useState<string>('');

    const connectedAccountActive =
        !address || resolvedAddress.toLowerCase() === connectedAccount.toLowerCase();

    useEffect(() => {
        (async () => {
            if (address && isAddressEns && mainnetProvider) {
                const newResolvedAddress = await mainnetProvider.resolveName(address);

                if (newResolvedAddress) {
                    setResolvedAddress(newResolvedAddress);
                }
            } else if (address && isAddressHex && !isAddressEns) {
                setResolvedAddress(address);
            }
        })();
    }, [address, isAddressHex, isAddressEns, mainnetProvider]);

    const [secondaryImageData, setSecondaryImageData] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            if (resolvedAddress && isInitialized && !connectedAccountActive) {
                const imageLocalURLs = await getNFTs(resolvedAddress);
                if (imageLocalURLs) setSecondaryImageData(imageLocalURLs);
            }
            // else if (address && isAddressHex && !isAddressEns && isInitialized) {
            //     const imageLocalURLs = await getNFTs(address);
            //     if (imageLocalURLs) setSecondaryImageData(imageLocalURLs);
            // }
        })();
    }, [resolvedAddress, isInitialized, connectedAccountActive]);

    const [secondaryensName, setSecondaryEnsName] = useState('');

    // check for ENS name account changes
    useEffect(() => {
        (async () => {
            if (address && isInitialized && !isAddressEns) {
                try {
                    const ensName = await fetchAddress(mainnetProvider, address, chainId);
                    if (ensName) setSecondaryEnsName(ensName);
                    else setSecondaryEnsName('');
                } catch (error) {
                    setSecondaryEnsName('');
                    console.log({ error });
                }
            }
        })();
    }, [address, isInitialized, isAddressEns]);

    useEffect(() => {
        console.log({ selectedToken });
    }, [selectedToken]);

    const [isTokenModalOpen, openTokenModal, closeTokenModal] = useModal();

    const [fullLayoutActive, setFullLayoutActive] = useState(false);
    const exchangeBalanceComponent = (
        <div className={styles.exchange_balance}>
            <ExchangeBalance
                crocEnv={crocEnv}
                mainnetProvider={mainnetProvider}
                connectedAccount={connectedAccount}
                setSelectedOutsideTab={setSelectedOutsideTab}
                setOutsideControl={setOutsideControl}
                openGlobalModal={openGlobalModal}
                closeGlobalModal={closeGlobalModal}
                selectedToken={selectedToken}
                tokenAllowance={tokenAllowance}
                tokenWalletBalance={tokenWalletBalance}
                tokenDexBalance={tokenDexBalance}
                setRecheckTokenAllowance={setRecheckTokenAllowance}
                setRecheckTokenBalances={setRecheckTokenBalances}
                lastBlockNumber={lastBlockNumber}
                openTokenModal={openTokenModal}
                fullLayoutActive={fullLayoutActive}
                setFullLayoutActive={setFullLayoutActive}
                selectedTokenDecimals={selectedTokenDecimals}
                gasPriceInGwei={gasPriceInGwei}
            />
        </div>
    );

    useEffect(() => {
        !connectedAccountActive ? setFullLayoutActive(true) : setFullLayoutActive(false);
    }, [connectedAccountActive]);

    const fullLayerToggle = (
        <div
            className={styles.right_tab_option}
            onClick={() => setFullLayoutActive(!fullLayoutActive)}
        >
            <section>
                {' '}
                <div
                    className={`${styles.full_layout_svg} ${
                        fullLayoutActive && styles.active_layout_style
                    } `}
                />
            </section>

            <section
                // onClick={() => setFullLayoutActive(!fullLayoutActive)}
                className={styles.shared_layout_svg}
            >
                <div
                    className={`${styles.full_layout_svg_copied} ${
                        !fullLayoutActive && styles.active_layout_style
                    }`}
                />
                <div
                    className={`${styles.half_layout_svg} ${
                        !fullLayoutActive && styles.active_layout_style
                    }`}
                />
            </section>
        </div>
    );

    const connectedUserNativeToken = useAppSelector((state) => state.userData.tokens.nativeToken);
    const connectedUserErc20Tokens = useAppSelector((state) => state.userData.tokens.erc20Tokens);

    // TODO: move this function up to App.tsx
    const getImportedTokensPlus = () => {
        const ambientTokens = getAmbientTokens();
        const ambientAddresses = ambientTokens.map((tkn) => tkn.address.toLowerCase());
        const output = ambientTokens;
        let tokensAdded = 0;
        connectedUserErc20Tokens?.forEach((tkn) => {
            if (
                !ambientAddresses.includes(tkn.address.toLowerCase()) &&
                tokensOnActiveLists.get(tkn.address + '_' + chainId) &&
                parseInt(tkn.combinedBalance as string) > 0 &&
                tokensAdded < 4
            ) {
                tokensAdded++;
                output.push({ ...tkn, fromList: 'wallet' });
            }
        });
        return output;
    };

    const connectedUserTokens = [connectedUserNativeToken].concat(connectedUserErc20Tokens);

    const [resolvedAddressNativeToken, setResolvedAddressNativeToken] = useState<
        TokenIF | undefined
    >();
    const [resolvedAddressErc20Tokens, setResolvedAddressErc20Tokens] = useState<TokenIF[]>([]);

    const resolvedAddressTokens = [resolvedAddressNativeToken].concat(resolvedAddressErc20Tokens);

    useEffect(() => {
        (async () => {
            if (
                crocEnv &&
                resolvedAddress &&
                chainId &&
                lastBlockNumber &&
                !connectedAccountActive
            ) {
                try {
                    // console.log('fetching native token balance');
                    const newNativeToken = await cachedFetchNativeTokenBalance(
                        resolvedAddress,
                        chainId,
                        lastBlockNumber,
                        crocEnv,
                    );

                    if (
                        JSON.stringify(resolvedAddressNativeToken) !==
                        JSON.stringify(newNativeToken)
                    ) {
                        setResolvedAddressNativeToken(newNativeToken);
                    }
                } catch (error) {
                    console.log({ error });
                }
                try {
                    const updatedTokens: TokenIF[] = resolvedAddressErc20Tokens;

                    // console.log('fetching resolved user erc20 token balances');
                    const erc20Results = await cachedFetchErc20TokenBalances(
                        resolvedAddress,
                        chainId,
                        lastBlockNumber,
                        crocEnv,
                    );

                    erc20Results.map((newToken: TokenIF) => {
                        const indexOfExistingToken = resolvedAddressErc20Tokens.findIndex(
                            (existingToken) => existingToken.address === newToken.address,
                        );

                        if (indexOfExistingToken === -1) {
                            updatedTokens.push(newToken);
                        } else if (
                            JSON.stringify(resolvedAddressErc20Tokens[indexOfExistingToken]) !==
                            JSON.stringify(newToken)
                        ) {
                            updatedTokens[indexOfExistingToken] = newToken;
                        }
                    });
                    setResolvedAddressErc20Tokens(updatedTokens);
                } catch (error) {
                    console.log({ error });
                }
            }
        })();
    }, [crocEnv, resolvedAddress, chainId, lastBlockNumber, connectedAccountActive]);

    const [showProfileSettings, setShowProfileSettings] = useState(false);

    const showLoggedInButton = userAccount && !isUserLoggedIn;

    return (
        <main data-testid={'portfolio'} className={styles.portfolio_container}>
            {userAccount && showProfileSettings && (
                <ProfileSettings
                    showProfileSettings={showProfileSettings}
                    setShowProfileSettings={setShowProfileSettings}
                    ensName={address ? secondaryensName : ensName}
                    imageData={connectedAccountActive ? userImageData : secondaryImageData}
                    openGlobalModal={openGlobalModal}
                />
            )}
            <PortfolioBanner
                ensName={address ? secondaryensName : ensName}
                resolvedAddress={resolvedAddress}
                activeAccount={address ?? connectedAccount}
                imageData={connectedAccountActive ? userImageData : secondaryImageData}
                setShowProfileSettings={setShowProfileSettings}
                connectedAccountActive={connectedAccountActive}
            />
            <div
                className={
                    fullLayoutActive
                        ? styles.full_layout_container
                        : styles.tabs_exchange_balance_container
                }
            >
                {!showLoggedInButton ? (
                    <PortfolioTabs
                        crocEnv={crocEnv}
                        isTokenABase={isTokenABase}
                        provider={provider}
                        cachedFetchTokenPrice={cachedFetchTokenPrice}
                        importedTokens={importedTokens}
                        connectedUserTokens={connectedUserTokens}
                        resolvedAddressTokens={resolvedAddressTokens}
                        resolvedAddress={resolvedAddress}
                        lastBlockNumber={lastBlockNumber}
                        activeAccount={address ?? connectedAccount}
                        connectedAccountActive={connectedAccountActive}
                        chainId={chainId}
                        tokenMap={tokensOnActiveLists}
                        selectedOutsideTab={selectedOutsideTab}
                        setSelectedOutsideTab={setSelectedOutsideTab}
                        setOutsideControl={setOutsideControl}
                        outsideControl={outsideControl}
                        openTokenModal={openTokenModal}
                        openGlobalModal={openGlobalModal}
                        closeGlobalModal={closeGlobalModal}
                        showSidebar={showSidebar}
                        account={props.account}
                        chainData={props.chainData}
                        currentPositionActive={props.currentPositionActive}
                        setCurrentPositionActive={props.setCurrentPositionActive}
                        isUserLoggedIn={isUserLoggedIn}
                        isAuthenticated={isAuthenticated}
                        baseTokenBalance={baseTokenBalance}
                        quoteTokenBalance={quoteTokenBalance}
                        baseTokenDexBalance={baseTokenDexBalance}
                        quoteTokenDexBalance={quoteTokenDexBalance}
                        currentTxActiveInTransactions={currentTxActiveInTransactions}
                        setCurrentTxActiveInTransactions={setCurrentTxActiveInTransactions}
                        fullLayoutToggle={fullLayerToggle}
                        handlePulseAnimation={handlePulseAnimation}
                    />
                ) : (
                    <div className={styles.non_connected_content}>
                        <p>Please connect wallet to view your transactions.</p>
                        <Button flat title='Connect Wallet' action={() => openModalWallet()} />
                    </div>
                )}
                {connectedAccountActive && exchangeBalanceComponent}
            </div>
            {isTokenModalOpen && (
                <Modal
                    onClose={closeTokenModal}
                    title='Select Token'
                    centeredTitle
                    handleBack={closeTokenModal}
                    showBackButton={true}
                    footer={null}
                >
                    <SoloTokenSelect
                        provider={provider}
                        closeModal={closeTokenModal}
                        chainId={chainId}
                        importedTokens={getImportedTokensPlus()}
                        setImportedTokens={setImportedTokens}
                        getTokensByName={getTokensByName}
                        getTokenByAddress={getTokenByAddress}
                        verifyToken={verifyToken}
                    />
                </Modal>
            )}
        </main>
    );
}
