// START: Import React and Dongles
import {
    useEffect,
    useState,
    Dispatch,
    SetStateAction,
    useContext,
    memo,
} from 'react';
import { useEnsName } from 'wagmi';
import { BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';

// START: Import JSX Components
import ExchangeBalance from '../../components/Portfolio/EchangeBalance/ExchangeBalance';
import PortfolioBanner from '../../components/Portfolio/PortfolioBanner/PortfolioBanner';
import PortfolioTabs from '../../components/Portfolio/PortfolioTabs/PortfolioTabs';
import Modal from '../../components/Global/Modal/Modal';
import NotFound from '../NotFound/NotFound';
import Button from '../../components/Global/Button/Button';
import ProfileSettings from '../../components/Portfolio/ProfileSettings/ProfileSettings';
import { SoloTokenSelect } from '../../components/Global/TokenSelectContainer/SoloTokenSelect';

// START: Import Other Local Files
import styles from './Portfolio.module.css';
import { TokenIF } from '../../utils/interfaces/exports';
import { useParams } from 'react-router-dom';
import { fetchAddress } from '../../App/functions/fetchAddress';
import { useModal } from '../../components/Global/Modal/useModal';
import {
    Erc20TokenBalanceFn,
    nativeTokenBalanceFn,
} from '../../App/functions/fetchTokenBalances';
import { useAppDispatch, useAppSelector } from '../../utils/hooks/reduxToolkit';
import { TokenPriceFn } from '../../App/functions/fetchTokenPrice';
import {
    setErc20Tokens,
    setNativeToken,
    setResolvedAddressRedux,
} from '../../utils/state/userDataSlice';
import useMediaQuery from '../../utils/hooks/useMediaQuery';
import { SpotPriceFn } from '../../App/functions/querySpotPrice';
import { PositionUpdateFn } from '../../App/functions/getPositionData';
import { CrocEnvContext } from '../../contexts/CrocEnvContext';
import { diffHashSig } from '../../utils/functions/diffHashSig';
import { ChainDataContext } from '../../contexts/ChainDataContext';
import { AppStateContext } from '../../contexts/AppStateContext';
import { tokenMethodsIF } from '../../App/hooks/useTokens';

interface propsIF {
    isTokenABase: boolean;
    cachedFetchNativeTokenBalance: nativeTokenBalanceFn;
    cachedFetchErc20TokenBalances: Erc20TokenBalanceFn;
    cachedPositionUpdateQuery: PositionUpdateFn;
    cachedFetchTokenPrice: TokenPriceFn;
    userAccount?: boolean;
    baseTokenBalance: string;
    quoteTokenBalance: string;
    baseTokenDexBalance: string;
    quoteTokenDexBalance: string;
    outputTokens: TokenIF[];
    validatedInput: string;
    setInput: Dispatch<SetStateAction<string>>;
    searchType: string;
    cachedQuerySpotPrice: SpotPriceFn;
    mainnetProvider: Provider | undefined;
    tokens: tokenMethodsIF;
}

function Portfolio(props: propsIF) {
    const {
        cachedQuerySpotPrice,
        cachedPositionUpdateQuery,
        isTokenABase,
        cachedFetchNativeTokenBalance,
        cachedFetchErc20TokenBalances,
        cachedFetchTokenPrice,
        userAccount,
        baseTokenBalance,
        quoteTokenBalance,
        baseTokenDexBalance,
        quoteTokenDexBalance,
        outputTokens,
        validatedInput,
        setInput,
        searchType,
        mainnetProvider,
        tokens,
    } = props;

    const { addressCurrent: userAddress, isLoggedIn: isUserConnected } =
        useAppSelector((state) => state.userData);
    const { data: ensName } = useEnsName({ address: userAddress });

    const {
        wagmiModal: { open: openModalWallet },
    } = useContext(AppStateContext);
    const {
        crocEnv,
        chainData: { chainId },
    } = useContext(CrocEnvContext);
    const { lastBlockNumber } = useContext(ChainDataContext);

    const dispatch = useAppDispatch();

    // CONTEXT: revisit after token changes go in
    const selectedToken: TokenIF = useAppSelector(
        (state) => state.soloTokenData.token,
    );

    const [tokenAllowance, setTokenAllowance] = useState<string>('');
    const [recheckTokenAllowance, setRecheckTokenAllowance] =
        useState<boolean>(false);
    const [recheckTokenBalances, setRecheckTokenBalances] =
        useState<boolean>(false);

    const [tokenWalletBalance, setTokenWalletBalance] = useState<string>('');
    const [tokenDexBalance, setTokenDexBalance] = useState<string>('');

    const selectedTokenAddress = selectedToken.address;
    const selectedTokenDecimals = selectedToken.decimals;

    const addTokenInfo = (token: TokenIF): TokenIF => {
        const oldToken: TokenIF | undefined = tokens.getTokenByAddress(
            token.address,
        );
        const newToken = { ...token };
        newToken.name = oldToken ? oldToken.name : '';
        newToken.logoURI = oldToken ? oldToken.logoURI : '';
        return newToken;
    };

    useEffect(() => {
        if (crocEnv && selectedToken.address && userAddress) {
            crocEnv
                .token(selectedToken.address)
                .wallet(userAddress)
                .then((bal: BigNumber) => setTokenWalletBalance(bal.toString()))
                .catch(console.error);
            crocEnv
                .token(selectedToken.address)
                .balance(userAddress)
                .then((bal: BigNumber) => {
                    setTokenDexBalance(bal.toString());
                })
                .catch(console.error);
        }

        if (recheckTokenBalances) {
            (async () => {
                if (userAddress) {
                    const newNativeToken: TokenIF =
                        await cachedFetchNativeTokenBalance(
                            userAddress,
                            chainId,
                            lastBlockNumber,
                            crocEnv,
                        );

                    dispatch(setNativeToken(newNativeToken));

                    const erc20Results: TokenIF[] =
                        await cachedFetchErc20TokenBalances(
                            userAddress,
                            chainId,
                            lastBlockNumber,
                            crocEnv,
                        );
                    const erc20TokensWithLogos = erc20Results.map((token) =>
                        addTokenInfo(token),
                    );

                    dispatch(setErc20Tokens(erc20TokensWithLogos));
                }
            })();
        }

        setRecheckTokenBalances(false);
    }, [
        crocEnv,
        selectedToken.address,
        userAddress,
        lastBlockNumber,
        recheckTokenBalances,
    ]);

    useEffect(() => {
        (async () => {
            if (crocEnv && userAddress && selectedTokenAddress) {
                try {
                    const allowance = await crocEnv
                        .token(selectedTokenAddress)
                        .allowance(userAddress);
                    setTokenAllowance(allowance.toString());
                } catch (err) {
                    console.warn(err);
                }
                setRecheckTokenAllowance(false);
            }
        })();
    }, [
        crocEnv,
        selectedTokenAddress,
        lastBlockNumber,
        userAddress,
        recheckTokenAllowance,
    ]);

    const { address: addressFromParams } = useParams();

    const isAddressEns = addressFromParams?.endsWith('.eth');
    const isAddressHex =
        addressFromParams?.startsWith('0x') && addressFromParams?.length == 42;

    if (addressFromParams && !isAddressEns && !isAddressHex)
        return <NotFound />;

    const [resolvedAddress, setResolvedAddress] = useState<string>('');

    const connectedAccountActive =
        !addressFromParams ||
        resolvedAddress.toLowerCase() === userAddress?.toLowerCase();

    useEffect(() => {
        (async () => {
            if (addressFromParams && isAddressEns && mainnetProvider) {
                try {
                    const newResolvedAddress =
                        await mainnetProvider.resolveName(addressFromParams);
                    if (newResolvedAddress) {
                        setResolvedAddress(newResolvedAddress);
                        dispatch(setResolvedAddressRedux(newResolvedAddress));
                    }
                } catch (error) {
                    console.error({ error });
                }
            } else if (addressFromParams && isAddressHex && !isAddressEns) {
                setResolvedAddress(addressFromParams);
                dispatch(setResolvedAddressRedux(addressFromParams));
            } else {
                setResolvedAddress('');
                dispatch(setResolvedAddressRedux(''));
            }
        })();
    }, [addressFromParams, isAddressHex, isAddressEns, mainnetProvider]);

    const [secondaryEnsName, setSecondaryEnsName] = useState('');
    // check for ENS name account changes
    useEffect(() => {
        (async () => {
            if (addressFromParams && !isAddressEns && mainnetProvider) {
                try {
                    const ensName = await fetchAddress(
                        mainnetProvider,
                        addressFromParams,
                        chainId,
                    );

                    if (ensName) setSecondaryEnsName(ensName);
                    else setSecondaryEnsName('');
                } catch (error) {
                    setSecondaryEnsName('');
                    console.error({ error });
                }
            } else if (addressFromParams && isAddressEns) {
                setSecondaryEnsName(addressFromParams);
            }
        })();
    }, [addressFromParams, isAddressEns, mainnetProvider]);

    const modalCloseCustom = (): void => setInput('');

    const [isTokenModalOpen, openTokenModal, closeTokenModal] =
        useModal(modalCloseCustom);

    const [fullLayoutActive, setFullLayoutActive] = useState<boolean>(false);
    const exchangeBalanceComponent = (
        <div className={styles.exchange_balance}>
            <ExchangeBalance
                mainnetProvider={mainnetProvider}
                selectedToken={selectedToken}
                tokenAllowance={tokenAllowance}
                tokenWalletBalance={tokenWalletBalance}
                tokenDexBalance={tokenDexBalance}
                setRecheckTokenAllowance={setRecheckTokenAllowance}
                setRecheckTokenBalances={setRecheckTokenBalances}
                openTokenModal={openTokenModal}
                fullLayoutActive={fullLayoutActive}
                setFullLayoutActive={setFullLayoutActive}
                selectedTokenDecimals={selectedTokenDecimals}
            />
        </div>
    );

    useEffect(() => {
        !connectedAccountActive
            ? setFullLayoutActive(true)
            : setFullLayoutActive(false);
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
            <section className={styles.shared_layout_svg}>
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

    const connectedUserNativeToken = useAppSelector(
        (state) => state.userData.tokens.nativeToken,
    );
    const connectedUserErc20Tokens = useAppSelector(
        (state) => state.userData.tokens.erc20Tokens,
    );

    const connectedUserTokens = [connectedUserNativeToken].concat(
        connectedUserErc20Tokens,
    );

    const [resolvedAddressNativeToken, setResolvedAddressNativeToken] =
        useState<TokenIF | undefined>();
    const [resolvedAddressErc20Tokens, setResolvedAddressErc20Tokens] =
        useState<TokenIF[]>([]);

    const resolvedAddressTokens = [resolvedAddressNativeToken].concat(
        resolvedAddressErc20Tokens,
    );

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
                    const newNativeToken = await cachedFetchNativeTokenBalance(
                        resolvedAddress,
                        chainId,
                        lastBlockNumber,
                        crocEnv,
                    );

                    if (
                        diffHashSig(resolvedAddressNativeToken) !==
                        diffHashSig(newNativeToken)
                    ) {
                        setResolvedAddressNativeToken(newNativeToken);
                    }
                } catch (error) {
                    console.error({ error });
                }
                try {
                    const updatedTokens: TokenIF[] = resolvedAddressErc20Tokens;

                    const erc20Results = await cachedFetchErc20TokenBalances(
                        resolvedAddress,
                        chainId,
                        lastBlockNumber,
                        crocEnv,
                    );

                    erc20Results.map((newToken: TokenIF) => {
                        const indexOfExistingToken =
                            resolvedAddressErc20Tokens.findIndex(
                                (existingToken) =>
                                    existingToken.address === newToken.address,
                            );

                        if (indexOfExistingToken === -1) {
                            updatedTokens.push(newToken);
                        } else if (
                            diffHashSig(
                                resolvedAddressErc20Tokens[
                                    indexOfExistingToken
                                ],
                            ) !== diffHashSig(newToken)
                        ) {
                            updatedTokens[indexOfExistingToken] = newToken;
                        }
                    });
                    setResolvedAddressErc20Tokens(updatedTokens);
                } catch (error) {
                    console.error({ error });
                }
            }
        })();
    }, [
        crocEnv,
        resolvedAddress,
        chainId,
        lastBlockNumber,
        connectedAccountActive,
    ]);

    const [showProfileSettings, setShowProfileSettings] = useState(false);

    const [showSoloSelectTokenButtons, setShowSoloSelectTokenButtons] =
        useState(true);

    const handleInputClear = () => {
        setInput('');
        const soloTokenSelectInput = document.getElementById(
            'solo-token-select-input',
        ) as HTMLInputElement;
        soloTokenSelectInput.value = '';
    };

    const showLoggedInButton = userAccount && !isUserConnected;
    const [showTabsAndNotExchange, setShowTabsAndNotExchange] = useState(false);
    const showActiveMobileComponent = useMediaQuery('(max-width: 1200px)');

    const mobileDataToggle = (
        <div className={styles.mobile_toggle_container}>
            <button
                onClick={() =>
                    setShowTabsAndNotExchange(!showTabsAndNotExchange)
                }
                className={
                    showTabsAndNotExchange
                        ? styles.non_active_button_mobile_toggle
                        : styles.active_button_mobile_toggle
                }
            >
                Transactions
            </button>
            <button
                onClick={() =>
                    setShowTabsAndNotExchange(!showTabsAndNotExchange)
                }
                className={
                    showTabsAndNotExchange
                        ? styles.active_button_mobile_toggle
                        : styles.non_active_button_mobile_toggle
                }
            >
                Exchange
            </button>
        </div>
    );

    const notConnectedContent = (
        <div className={styles.non_connected_content}>
            <p>Please connect your wallet.</p>
            <Button
                flat
                title='Connect Wallet'
                action={() => openModalWallet()}
            />
        </div>
    );

    const portfolioTabsProps = {
        cachedQuerySpotPrice: cachedQuerySpotPrice,
        cachedPositionUpdateQuery: cachedPositionUpdateQuery,
        isTokenABase: isTokenABase,
        cachedFetchTokenPrice: cachedFetchTokenPrice,
        connectedUserTokens: connectedUserTokens,
        resolvedAddressTokens: resolvedAddressTokens,
        resolvedAddress: resolvedAddress,
        connectedAccountActive: connectedAccountActive,
        openTokenModal: openTokenModal,
        baseTokenBalance: baseTokenBalance,
        quoteTokenBalance: quoteTokenBalance,
        baseTokenDexBalance: baseTokenDexBalance,
        quoteTokenDexBalance: quoteTokenDexBalance,
        fullLayoutToggle: fullLayerToggle,
        tokens: tokens,
    };

    const portfolioBannerProps = {
        ensName: connectedAccountActive
            ? ensName ?? ''
            : secondaryEnsName
            ? secondaryEnsName
            : '',
        resolvedAddress: resolvedAddress,
        setShowProfileSettings: setShowProfileSettings,
        connectedAccountActive: connectedAccountActive,
    };

    const profileSettingsProps = {
        showProfileSettings: showProfileSettings,
        setShowProfileSettings: setShowProfileSettings,
        ensName: secondaryEnsName ? secondaryEnsName : ensName ?? '',
    };

    const mobilePortfolio = (
        <section
            style={{
                height: 'calc(100vh - 8rem)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                margin: '0 auto',
                paddingLeft: '8px',
            }}
        >
            {connectedAccountActive && mobileDataToggle}
            {!showTabsAndNotExchange ? (
                showLoggedInButton ? (
                    notConnectedContent
                ) : (
                    <PortfolioTabs {...portfolioTabsProps} />
                )
            ) : showLoggedInButton ? (
                notConnectedContent
            ) : (
                connectedAccountActive && exchangeBalanceComponent
            )}
        </section>
    );

    if (showActiveMobileComponent) return mobilePortfolio;

    return (
        <main data-testid={'portfolio'} className={styles.portfolio_container}>
            {userAccount && showProfileSettings && (
                <ProfileSettings {...profileSettingsProps} />
            )}
            <PortfolioBanner {...portfolioBannerProps} />

            <div
                className={
                    fullLayoutActive
                        ? styles.full_layout_container
                        : styles.tabs_exchange_balance_container
                }
            >
                {!showLoggedInButton ? (
                    <PortfolioTabs {...portfolioTabsProps} />
                ) : (
                    notConnectedContent
                )}

                {showLoggedInButton
                    ? notConnectedContent
                    : connectedAccountActive && exchangeBalanceComponent}
            </div>
            {isTokenModalOpen && (
                <Modal
                    onClose={closeTokenModal}
                    title='Select Token'
                    centeredTitle
                    handleBack={handleInputClear}
                    showBackButton={!showSoloSelectTokenButtons}
                    footer={null}
                >
                    <SoloTokenSelect
                        modalCloseCustom={modalCloseCustom}
                        closeModal={closeTokenModal}
                        importedTokensPlus={outputTokens}
                        showSoloSelectTokenButtons={showSoloSelectTokenButtons}
                        setShowSoloSelectTokenButtons={
                            setShowSoloSelectTokenButtons
                        }
                        outputTokens={outputTokens}
                        validatedInput={validatedInput}
                        setInput={setInput}
                        searchType={searchType}
                        isSingleToken={true}
                        tokenAorB={null}
                        tokens={tokens}
                    />
                </Modal>
            )}
        </main>
    );
}

export default memo(Portfolio);
