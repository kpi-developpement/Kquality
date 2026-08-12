import styles from './Card.module.css';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  alert?: boolean;
}

export default function Card({ title, value, subtitle, alert = false }: CardProps) {
  return (
    <div className={`${styles.card}${alert ? styles.alertCard : ''}`}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>{value}</p>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  );
}