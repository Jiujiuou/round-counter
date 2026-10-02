import { X, Loader2 } from 'lucide-react'
import styles from '@/components/Dialog/index.module.less'

export default function Dialog({ open, onClose, title, content, onConfirm, confirmText = '确认', confirmLoading = false }) {
  if (!open) return null
  return (
    <div className={styles.root}>
      <div className={styles.scrim} onClick={onClose} />
      <div className={styles.card}>
        <button className={styles.close} onClick={onClose} aria-label="关闭">
          <X size={18} strokeWidth={1.8} />
        </button>
        <div className={styles.title}>{title}</div>
        <div className={styles.content}>{content}</div>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose} disabled={confirmLoading}>
            取消
          </button>
          <button className={styles.confirm} onClick={onConfirm} disabled={confirmLoading}>
            {confirmLoading && <span className={styles.spinner}><Loader2 size={18} /></span>}
            {confirmLoading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
