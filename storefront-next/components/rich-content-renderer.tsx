import Link from "next/link";
import type { RichContentBlock, RichTextNode } from "@/lib/types";

type RichContentRendererProps = {
  blocks: RichContentBlock[];
  className?: string;
};

function RichText({ nodes }: { nodes: RichTextNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        const key = `${node.type}-${index}`;

        switch (node.type) {
          case "text":
            return <span key={key}>{node.text}</span>;
          case "lineBreak":
            return <br key={key} />;
          case "strong":
            return (
              <strong key={key}>
                <RichText nodes={node.children} />
              </strong>
            );
          case "emphasis":
            return (
              <em key={key}>
                <RichText nodes={node.children} />
              </em>
            );
          case "code":
            return (
              <code key={key}>
                <RichText nodes={node.children} />
              </code>
            );
          case "superscript":
            return (
              <sup key={key}>
                <RichText nodes={node.children} />
              </sup>
            );
          case "subscript":
            return (
              <sub key={key}>
                <RichText nodes={node.children} />
              </sub>
            );
          case "link":
            return node.external ? (
              <a key={key} href={node.href} target="_blank" rel="noreferrer">
                <RichText nodes={node.children} />
              </a>
            ) : (
              <Link key={key} href={node.href}>
                <RichText nodes={node.children} />
              </Link>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function renderListItem(blocks: RichContentBlock[], key: string) {
  return (
    <li key={key}>
      <RichContentRenderer blocks={blocks} />
    </li>
  );
}

function renderBlocks(blocks: RichContentBlock[]) {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}`;

    switch (block.type) {
      case "paragraph":
        return (
          <p key={key}>
            <RichText nodes={block.children} />
          </p>
        );
      case "heading": {
        const HeadingTag = `h${block.level}` as const;
        return (
          <HeadingTag key={key}>
            <RichText nodes={block.children} />
          </HeadingTag>
        );
      }
      case "list": {
        const ListTag = block.ordered ? "ol" : "ul";
        return <ListTag key={key}>{block.items.map((item, itemIndex) => renderListItem(item, `${key}-${itemIndex}`))}</ListTag>;
      }
      case "image":
        return (
          <figure key={key}>
            <img src={block.src} alt={block.alt} />
            {block.caption?.length ? (
              <figcaption>
                <RichText nodes={block.caption} />
              </figcaption>
            ) : null}
          </figure>
        );
      case "quote":
        return (
          <blockquote key={key}>
            <RichContentRenderer blocks={block.blocks} />
          </blockquote>
        );
      case "table":
        return (
          <table key={key}>
            {block.head ? (
              <thead>
                {block.head.map((row, rowIndex) => (
                  <tr key={`${key}-head-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <th key={`${key}-head-cell-${cellIndex}`}>
                        <RichContentRenderer blocks={cell} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
            ) : null}
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${key}-cell-${cellIndex}`}>
                      <RichContentRenderer blocks={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "embed":
        return (
          <section key={key} className="article-embed article-embed--instagram">
            {block.eyebrow ? <p className="article-embed__eyebrow">{block.eyebrow}</p> : null}
            <h2 className="article-embed__title">{block.title}</h2>
            {block.copy ? <p className="article-embed__copy">{block.copy}</p> : null}
            <a className="button button--solid article-embed__button" href={block.href} target="_blank" rel="noopener noreferrer">
              {block.ctaLabel}
            </a>
          </section>
        );
      case "snapshot":
        return (
          <section
            key={key}
            className={`snapshot-section${block.reversed ? " reversed-section" : ""}`}
          >
            <div className="left">
              {block.image ? <img src={block.image.src} alt={block.image.alt} /> : null}
            </div>
            <div className="right">
              {block.title ? <h2>{block.title}</h2> : null}
              <RichContentRenderer blocks={block.body} />
            </div>
          </section>
        );
      case "divider":
        return <hr key={key} />;
      default:
        return null;
    }
  });
}

export function RichContentRenderer({ blocks, className }: RichContentRendererProps) {
  if (!blocks.length) {
    return null;
  }

  return <div className={className}>{renderBlocks(blocks)}</div>;
}
