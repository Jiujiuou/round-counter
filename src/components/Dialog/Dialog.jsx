import styles from '@/components/Dialog/index.module.less'

export default function Dialog({ open, onClose, title, content, onConfirm, confirmText = '确认', danger }) {
  if (!open) return null
  return (
    <div className={styles.root}>
      <div className={styles.scrim} onClick={onClose} />
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.content}>{content}</div>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>取消</button>
          <button className={`${styles.confirm} ${danger ? styles.danger : ''}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
