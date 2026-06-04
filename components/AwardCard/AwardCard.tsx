import Link from "next/link";
import { Trophy } from "lucide-react";
import { cvData } from "@/data/cv";
import styles from "./AwardCard.module.css";

const placementLabels: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  "3rd": "3rd place",
  "2nd": "2nd place",
  "1st": "1st place",
  winner: "Winner",
  finalist: "Finalist",
};

export default function AwardCard() {
  const { awards } = cvData;

  if (awards.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Trophy size={20} className={styles.icon} />
        <h3 className={styles.title}>Awards</h3>
      </div>
      <ul className={styles.list}>
        {awards.map((award) => (
          <li key={award.id} className={styles.item}>
            <span
              className={styles.placement}
              data-placement={award.placement}
            >
              {placementLabels[award.placement] ?? award.placement}
            </span>
            <span className={styles.detail}>
              {award.category}
              <span className={styles.issuer}>
                {award.name} {award.date}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/cv" className={styles.link}>
        View full CV
      </Link>
    </div>
  );
}
