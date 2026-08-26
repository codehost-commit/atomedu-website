"use client";

import katex from "katex";

type Part = { value: string; math: boolean; display: boolean };

function splitMath(value: string): Part[] {
  const parts: Part[] = [];
  const matcher = /(\\\[(?:.|\n)*?\\\]|\\\((?:.|\n)*?\\\)|\$\$(?:.|\n)*?\$\$|\$[^$\n]+\$)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(value))) {
    if (match.index > last) parts.push({ value: value.slice(last, match.index), math: false, display: false });
    const raw = match[0];
    const display = raw.startsWith("\\[") || raw.startsWith("$$");
    const body = raw.startsWith("\\[")
      ? raw.slice(2, -2)
      : raw.startsWith("\\(")
        ? raw.slice(2, -2)
        : raw.startsWith("$$")
          ? raw.slice(2, -2)
          : raw.slice(1, -1);
    parts.push({ value: body.trim(), math: true, display });
    last = matcher.lastIndex;
  }
  if (last < value.length) parts.push({ value: value.slice(last), math: false, display: false });
  return parts.length ? parts : [{ value, math: false, display: false }];
}

export function MathText({ children }: { children: string }) {
  return (
    <>
      {splitMath(children).map((part, index) => {
        if (!part.math) return <span key={index}>{part.value}</span>;
        const html = katex.renderToString(part.value, {
          displayMode: part.display,
          throwOnError: false,
          strict: "ignore",
        });
        return (
          <span
            className={part.display ? "math-display" : "math-inline"}
            key={index}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </>
  );
}

export function WorksheetPreview({ content }: { content: string }) {
  return (
    <article className="worksheet-paper">
      {content.split("\n").map((line, index) => {
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          const className = `worksheet-heading worksheet-heading-${level}`;
          return <div className={className} key={index}><MathText>{heading[2]}</MathText></div>;
        }
        if (!line.trim()) return <div className="worksheet-gap" key={index} />;
        return <p className="worksheet-line" key={index}><MathText>{line}</MathText></p>;
      })}
    </article>
  );
}
