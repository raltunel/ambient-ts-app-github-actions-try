// START: Import React and Dongles
import { useCallback, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

// START: Import Local Files
import styles from './SimpleModal.module.css';

// interface for React functional component
interface SimpleModalPropsIF {
    noBackground?: boolean;
    onClose: () => void;
    handleBack?: () => void;

    children: ReactNode;
}

// React functional component
export default function SimpleModal(props: SimpleModalPropsIF) {
    const {
        onClose,

        children,
        noBackground,
    } = props;

    const escFunction = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', escFunction, false);
        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, []);

    return (
        <div className={styles.outside_modal} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`
                    ${styles.modal_body}
                    ${noBackground ? styles.no_background_modal : null}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                <section className={styles.modal_content}>{children}</section>
            </motion.div>
        </div>
    );
}
