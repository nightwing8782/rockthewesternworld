'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Heart, Shield, Sparkles } from 'lucide-react';

interface CommentsSectionProps {
  slug: string;
  title: string;
}

export default function CommentsSection({ slug, title }: CommentsSectionProps) {
  const commentContainerRef = useRef<HTMLDivElement>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Giscus configuration options (via GitHub Discussions)
  const giscusRepo = process.env.NEXT_PUBLIC_GISCUS_REPO || 'nightwing8782/rockthewesternworld';
  const giscusRepoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || '';
  const giscusCategory = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'General';
  const giscusCategoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '';

  // Cusdis App ID configuration (Optional cookie-free embed)
  const cusdisAppId = process.env.NEXT_PUBLIC_CUSDIS_APP_ID || '';

  useEffect(() => {
    if (!commentContainerRef.current) return;
    commentContainerRef.current.innerHTML = '';

    if (giscusRepo && giscusRepoId && giscusCategoryId) {
      // Load Giscus script
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', giscusRepo);
      script.setAttribute('data-repo-id', giscusRepoId);
      script.setAttribute('data-category', giscusCategory);
      script.setAttribute('data-category-id', giscusCategoryId);
      script.setAttribute('data-mapping', 'pathname');
      script.setAttribute('data-strict', '0');
      script.setAttribute('data-reactions-enabled', '1');
      script.setAttribute('data-emit-metadata', '0');
      script.setAttribute('data-input-position', 'top');
      script.setAttribute('data-theme', 'noborder_light');
      script.setAttribute('data-lang', 'en');
      script.setAttribute('crossorigin', 'anonymous');
      script.async = true;

      script.onload = () => setCommentsLoaded(true);
      commentContainerRef.current.appendChild(script);
    } else if (cusdisAppId) {
      // Load Cusdis script
      const script = document.createElement('script');
      script.src = 'https://cusdis.com/js/cusdis.es.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setCommentsLoaded(true);
      commentContainerRef.current.appendChild(script);
    }
  }, [slug, giscusRepo, giscusRepoId, giscusCategoryId, cusdisAppId]);

  const hasConfiguredService = (giscusRepo && giscusRepoId && giscusCategoryId) || cusdisAppId;

  return (
    <section className="mt-16 pt-12 border-t-2 border-[#E5DFD7] max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#FAF8F5] rounded-xl border border-[#D5CEC5] shadow-xs text-[#242120]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#242120] tracking-wide">
              Reader Discussion
            </h3>
            <p className="font-sans text-xs text-[#736B63]">
              Thoughts, reflections, and dialogue on &ldquo;{title}&rdquo;
            </p>
          </div>
        </div>

        <span className="font-sans text-[11px] font-semibold text-[#8C827A] uppercase tracking-widest hidden sm:inline">
          Open Web
        </span>
      </div>

      {hasConfiguredService ? (
        <div className="min-h-[140px] bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5DFD7]">
          {cusdisAppId && (
            <div
              id="cusdis_thread"
              data-host="https://cusdis.com"
              data-app-id={cusdisAppId}
              data-page-id={slug}
              data-page-url={`https://rockthewesternworld.com/${slug}`}
              data-page-title={title}
            />
          )}
          <div ref={commentContainerRef} />
        </div>
      ) : (
        /* Clean IndieWeb / Email response fallback */
        <div className="bg-[#FAF8F5] p-6 sm:p-8 rounded-2xl border border-[#E5DFD7] text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#EAE4DC] flex items-center justify-center text-[#59524C]">
            <Heart className="w-5 h-5 text-[#8C827A]" />
          </div>
          <h4 className="font-serif text-base font-bold text-[#242120]">
            Join the Conversation
          </h4>
          <p className="font-sans text-xs text-[#736B63] max-w-md mx-auto leading-relaxed">
            Have thoughts, counterpoints, or reading recommendations related to this essay? Send a direct reply or feedback letter to Dan.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:danbillingsster@gmail.com?subject=${encodeURIComponent(`Response to "${title}"`)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#242120] hover:bg-[#3D3835] text-[#FAF8F5] font-sans text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-xs"
            >
              <span>Write a Reply</span>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
