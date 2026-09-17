'use client';

import { useState } from 'react';

interface ArticleHeroImageProps {
  src: string;
  alt: string;
  caption?: string;
  creditTitle?: string;
  creditCreator?: string;
  creditSource?: string;
  creditSourceUrl?: string;
  creditLicense?: string;
  imageCredit?: string;
}

export default function ArticleHeroImage({
  src,
  alt,
  caption,
  creditTitle,
  creditCreator,
  creditSource,
  creditSourceUrl,
  creditLicense,
  imageCredit,
}: ArticleHeroImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  const hasAnyCredit = caption || creditTitle || creditCreator || creditSource || imageCredit;

  return (
    <figure className="my-8">
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full max-h-[460px] object-cover border border-[#DDD5C7] shadow-xs"
      />
      {hasAnyCredit && (
        <figcaption className="mt-2.5 text-[12px] text-[#57534E] font-serif text-center flex flex-wrap items-center justify-center gap-1.5 leading-relaxed">
          {caption && (
            <span className="italic text-[#292524] mr-1">{caption}</span>
          )}
          {caption && (creditTitle || creditCreator || creditSource || imageCredit) && (
            <span className="text-[#A8A29E] font-sans text-[10px]">|</span>
          )}
          <span className="text-[#78716C] font-mono text-[11px]">
            Photo / Art:
          </span>
          {creditSourceUrl ? (
            <a
              href={creditSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1E40AF] underline decoration-[#1E40AF]/30 underline-offset-2 hover:decoration-[#1E40AF]"
            >
              {creditTitle || 'Source'}
            </a>
          ) : (
            <span className="font-medium text-[#292524]">
              {creditTitle || imageCredit || 'Archive'}
            </span>
          )}
          {creditCreator && (
            <span className="text-[#78716C]">by {creditCreator}</span>
          )}
          {creditSource && (
            <span className="text-[#A8A29E] text-[11px]">(via {creditSource})</span>
          )}
          {creditLicense && (
            <span className="text-[10px] text-[#A8A29E] border border-[#E5DFC5] px-1 py-0.5 rounded font-mono ml-0.5">
              {creditLicense}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
