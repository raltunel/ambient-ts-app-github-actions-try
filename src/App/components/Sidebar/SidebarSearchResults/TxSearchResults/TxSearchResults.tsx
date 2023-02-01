import { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../SidebarSearchResults.module.css';
import { TransactionIF } from '../../../../../utils/interfaces/exports';
import TxLI from './TxLI';

interface propsIF {
    chainId: string;
    searchedTxs: TransactionIF[];
    setOutsideControl: Dispatch<SetStateAction<boolean>>;
    setSelectedOutsideTab: Dispatch<SetStateAction<number>>;
    setCurrentTxActiveInTransactions: Dispatch<SetStateAction<string>>;
    setIsShowAllEnabled: Dispatch<SetStateAction<boolean>>;
}

export default function TxSearchResults(props: propsIF) {
    const {
        chainId,
        searchedTxs,
        setOutsideControl,
        setSelectedOutsideTab,
        setCurrentTxActiveInTransactions,
        setIsShowAllEnabled,
    } = props;

    const navigate = useNavigate();

    const handleClick = (tx: TransactionIF): void => {
        setOutsideControl(true);
        setSelectedOutsideTab(0);
        setIsShowAllEnabled(false);
        setCurrentTxActiveInTransactions(tx.id);
        navigate(
            '/trade/market/chain=' +
            chainId +
            '&tokenA=' +
            tx.base +
            '&tokenB=' +
            tx.quote
        );
    }

    // TODO:   @Junior  please refactor the header <div> as a <header> element
    // TODO:   @Junior  also make the <div> elems inside it into <hX> elements

    return (
        <div>
            <div className={styles.card_title}>My Recent Transactions</div>
            {searchedTxs.length ? (
                <>
                    <div className={styles.header}>
                        <div>Pool</div>
                        <div>Type</div>
                        <div>Value</div>
                    </div>
                    <div className={styles.main_result_container}>
                        {searchedTxs.slice(0, 4).map((tx: TransactionIF) => (
                            <TxLI
                                key={`tx-sidebar-search-result-${JSON.stringify(tx)}`}
                                tx={tx}
                                handleClick={handleClick}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <h5 className={styles.not_found_text}>No Transactions Found</h5>
            )}
        </div>
    );
}