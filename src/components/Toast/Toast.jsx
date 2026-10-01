import styles from '@/components/Toast/index.module.less'

export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className={styles.root}>
      <span className={styles.text}>{message}</span>
    </div>
  )
}
