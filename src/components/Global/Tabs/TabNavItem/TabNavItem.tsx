import styles from './TabNavItem.module.css';
import { SetStateAction } from 'react';

interface TabNavItemProps {
    title: string;

    setActiveTab: React.Dispatch<SetStateAction<string>>;
    id: string;
    activeTab: string;
}
export default function Toggle(props: TabNavItemProps) {
    const { title, id, setActiveTab, activeTab } = props;

    const handleClick = () => {
        setActiveTab(id);
    };

    const activeStyle = activeTab === id ? styles.tab_active : null;
    return (
        <li onClick={handleClick} className={`${activeStyle} ${styles.tab_list}`}>
            {activeTab === id ? <div className={styles.underline} /> : null}
            {title}
        </li>
    );
}