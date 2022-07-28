import OrdersMenu from './TableMenuComponents/OrdersMenu';
import RangesMenu from './TableMenuComponents/RangesMenu';
import TransactionsMenu from './TableMenuComponents/TransactionsMenu';

interface TableMenuProps {
    tableType: 'orders' | 'ranges' | 'transactions';
}
export default function TableMenu(props: TableMenuProps) {
    const { tableType } = props;
    const menuData = {
        orders: <OrdersMenu />,
        ranges: <RangesMenu />,
        transactions: <TransactionsMenu />,
    };

    return <>{menuData[tableType]}</>;
}