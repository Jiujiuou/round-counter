import styles from '@/components/Layout/index.module.less'

export default function Layout({ children }) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
