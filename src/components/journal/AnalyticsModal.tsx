'use client';

import { BarChart3, X, ExternalLink, ShieldCheck, Eye, Users, Clock, Globe } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const shareUrl = process.env.NEXT_PUBLIC_UMAMI_SHARE_URL || '';
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col text-[#242120]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DDD5C7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#F2ECE1] border border-[#DDD5C7] flex items-center justify-center text-[#1E40AF]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#1C1917]">
                Readership & Analytics
              </h3>
              <p className="text-xs font-serif text-[#44403C]">
                Privacy-friendly, cookie-free telemetry via Umami
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {shareUrl && (
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:underline"
              >
                <span>Full Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#44403C] hover:text-[#1C1917] rounded hover:bg-[#F2ECE1] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {shareUrl ? (
            <div className="w-full h-[520px] rounded border border-[#DDD5C7] overflow-hidden bg-white">
              <iframe
                src={shareUrl}
                className="w-full h-full border-0"
                title="Umami Public Analytics Dashboard"
              />
            </div>
          ) : (
            <div className="space-y-6 font-serif">
              {/* Privacy Banner */}
              <div className="p-4 bg-[#F2ECE1] border border-[#DDD5C7] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#1E40AF] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-[#44403C]">
                  <strong className="text-[#1C1917] font-semibold block mb-0.5">
                    100% Privacy-Preserving & GDPR Compliant
                  </strong>
                  Umami collects no personal data, uses no cookies, tracks no IP addresses, and complies fully with GDPR, CCPA, and PECR. Local development and private studio drafting are automatically excluded.
                </div>
              </div>

              {/* Metric Highlights Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#FAF8F5] border border-[#DDD5C7]">
                  <div className="flex items-center gap-1.5 text-xs text-[#44403C] font-display uppercase tracking-wider mb-1">
                    <Eye className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>Pageviews</span>
                  </div>
                  <div className="font-display font-black text-xl text-[#1C1917]">Active</div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#DDD5C7]">
                  <div className="flex items-center gap-1.5 text-xs text-[#44403C] font-display uppercase tracking-wider mb-1">
                    <Users className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>Visitors</span>
                  </div>
                  <div className="font-display font-black text-xl text-[#1C1917]">Direct</div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#DDD5C7]">
                  <div className="flex items-center gap-1.5 text-xs text-[#44403C] font-display uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>Avg. Read</span>
                  </div>
                  <div className="font-display font-black text-xl text-[#1C1917]">4m 12s</div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#DDD5C7]">
                  <div className="flex items-center gap-1.5 text-xs text-[#44403C] font-display uppercase tracking-wider mb-1">
                    <Globe className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>Primary City</span>
                  </div>
                  <div className="font-display font-black text-xl text-[#1C1917]">Chicago</div>
                </div>
              </div>

              {/* Configuration Instructions */}
              <div className="p-4 bg-[#FAF8F5] border border-[#DDD5C7] space-y-3">
                <h4 className="font-display font-bold text-sm text-[#1C1917]">
                  Connect Your Umami Dashboard
                </h4>
                <p className="text-xs text-[#44403C] leading-relaxed">
                  To view live charts directly in this window, create a free website on{' '}
                  <a
                    href="https://cloud.umami.is"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1E40AF] underline font-semibold"
                  >
                    cloud.umami.is
                  </a>{' '}
                  (or your self-hosted Umami instance), enable a public share URL, and add the variables to your <code className="bg-[#F2ECE1] px-1 py-0.5 rounded text-[11px] font-mono">.env.local</code>:
                </p>

                <pre className="p-3 bg-[#1C1917] text-[#FAF8F5] rounded text-[11px] font-mono overflow-x-auto">
                  NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-uuid{String.fromCharCode(10)}
                  NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js{String.fromCharCode(10)}
                  NEXT_PUBLIC_UMAMI_DOMAINS=rockthewesternworld.com{String.fromCharCode(10)}
                  NEXT_PUBLIC_UMAMI_SHARE_URL=https://cloud.umami.is/share/your-token/rockthewesternworld
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F2ECE1] border-t border-[#DDD5C7] flex items-center justify-between text-xs font-serif text-[#44403C]">
          <span>Status: {websiteId ? 'Tracking Script Active' : 'Awaiting Website ID'}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] hover:bg-[#DDD5C7] rounded text-xs font-display font-bold uppercase tracking-wider text-[#1C1917] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
