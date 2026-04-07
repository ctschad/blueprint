import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  legacyPath: string;
  eyebrow?: string;
};

export function LegacyFrame({ title, description, legacyPath, eyebrow = "Page" }: Props) {
  return (
    <section className="shell page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <Link href={legacyPath} className="button button--ghost" target="_blank">
          Open original page
        </Link>
      </div>
      {description ? <p className="section-copy section-copy--narrow">{description}</p> : null}
      <div className="legacy-frame__shell">
        <iframe src={legacyPath} title={title} className="legacy-frame__iframe" />
      </div>
    </section>
  );
}
