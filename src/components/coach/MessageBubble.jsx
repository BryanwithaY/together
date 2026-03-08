import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-stone-800 flex items-center justify-center mt-0.5 flex-shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className={cn('max-w-[85%]', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'rounded-2xl px-4 py-3',
          isUser ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200'
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="text-sm prose prose-sm prose-stone max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                p: ({ children }) => <p className="my-1.5 leading-relaxed text-stone-700">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-stone-800">{children}</strong>,
                h1: ({ children }) => <h1 className="text-base font-bold text-stone-800 mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-stone-800 mt-3 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-stone-700 mt-2.5 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="my-2 space-y-1 pl-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-stone-700">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-stone-300 pl-3 my-2 text-stone-600 italic">{children}</blockquote>
                ),
                hr: () => <hr className="my-3 border-stone-200" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}