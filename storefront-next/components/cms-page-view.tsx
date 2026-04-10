import { RichContentRenderer } from "@/components/rich-content-renderer";
import type { StaticPage } from "@/lib/types";

export function CmsPageView({ page }: { page: StaticPage }) {
  return (
    <section className="shell page-section cms-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Page</p>
          <h1>{page.title}</h1>
        </div>
      </div>

      {page.description ? <p className="section-copy section-copy--narrow">{page.description}</p> : null}

      {page.bodyHtml ? (
        <div className="surface-card cms-content">
          <RichContentRenderer blocks={page.bodyBlocks ?? []} />
        </div>
      ) : (
        <div className="empty-state">
          <h2>This page is still being prepared.</h2>
          <p>Please check back soon.</p>
        </div>
      )}
    </section>
  );
}
