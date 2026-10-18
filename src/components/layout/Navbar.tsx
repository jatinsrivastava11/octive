import Link from "next/link";
import styles from "./Navbar.module.css";

interface NavbarProps {
  userHandle?: string;
  avatarUrl?: string;
}

export function Navbar({ userHandle, avatarUrl }: NavbarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandTitle}>OCTIVE</span>
            <span className={styles.brandDot} />
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={`${styles.navLink} ${styles.active}`}>
              Overview
            </Link>
            <Link href="#cards" className={styles.navLink}>
              Trading Cards
            </Link>
            <Link href="#rankings" className={styles.navLink}>
              Rankings & Cred
            </Link>
          </nav>
        </div>

        <div className={styles.right}>
          {userHandle ? (
            <div className={styles.userProfile}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={userHandle} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>{userHandle.slice(0, 1).toUpperCase()}</div>
              )}
              <span className={styles.handle}>@{userHandle}</span>
            </div>
          ) : (
            <Link href="/signin" className={styles.connectButton}>
              Connect Spotify
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
