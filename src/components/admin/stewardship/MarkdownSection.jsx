import React from 'react';
import ReactMarkdown from 'react-markdown';

// Shared renderer for stewardship doctrine markdown content — no typography
// plugin installed, so heading/paragraph/list styles are applied via arbitrary
// Tailwind variants targeting the rendered markdown elements.
export default function MarkdownSection({ content }) {
  return (
    <div
      className="text-sm text-stone-700 leading-relaxed
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-stone-800 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:first:mt-0
        [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-stone-800 [&_h2]:mt-6 [&_h2]:mb-2
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-stone-800 [&_h3]:mt-5 [&_h3]:mb-1.5
        [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-stone-700 [&_h4]:mt-4 [&_h4]:mb-1
        [&_p]:mb-2.5
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
        [&_strong]:font-semibold [&_strong]:text-stone-800
        [&_hr]:my-6 [&_hr]:border-stone-200"
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}