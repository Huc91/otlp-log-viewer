import Link from "next/link";
import { Logo } from "@/components/logo/logo";
import styles from "./style.module.css";

export function NavBar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" aria-label="Home">
          <Logo className={styles.logo} />
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Dashboard
          </Link>
          <span className={styles.inactiveItem}>Settings</span>
        </nav>
      </div>
    </header>
  );
}
