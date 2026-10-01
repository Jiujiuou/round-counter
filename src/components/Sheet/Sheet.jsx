import { X } from 'lucide-react'
import styles from '@/components/Sheet/index.module.less'

export default function Sheet({ open, onClose, title, children }) {
  return (
    <div className={`${styles.root} ${open ? styles.open : ''}`}>
      <div className={styles.scrim} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={onClose} aria-label="关闭">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
