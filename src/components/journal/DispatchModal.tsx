'use client';

import { useState, useEffect } from 'react';
import {
  fetchSubscribers,
  generateDispatchEmailHtml,
  sendResendEmail,
  Subscriber,
} from '@/lib/dispatch';
import {
  X,
  Send,
  Users,
  Eye,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  kicker?: string;
  excerpt?: string;
  contentHtml?: string;
  publishedAt?: string;
}

export default function DispatchModal({
  isOpen,
  onClose,
  title,
  slug,
  kicker = 'EDITORIAL DISPATCH',
  excerpt = '',
  contentHtml = '',
  publishedAt,
}: DispatchModalProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'subscribers' | 'settings'>('compose');

  // Dispatch content state
  const [subject, setSubject] = useState('');
  const [customKicker, setCustomKicker] = useState(kicker);
  const [customExcerpt, setCustomExcerpt] = useState(excerpt);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Resend Settings
  const [apiKey, setApiKey] = useState('');
  const [fromAddress, setFromAddress] = useState('Rock The Western World <onboarding@resend.dev>');
  const [testEmail, setTestEmail] = useState('');

  // Sending status
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number } | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync title and excerpt when opened
  useEffect(() => {
    if (isOpen) {
      setSubject(`The Dispatch: ${title || 'New Broadside Entry'}`);
      setCustomKicker(kicker || 'EDITORIAL DISPATCH');
      setCustomExcerpt(excerpt || '');
      setTestStatus('idle');
      setBroadcastResult(null);
      setBroadcastProgress(null);
    }
  }, [isOpen, title, kicker, excerpt]);

  // Load Saved Keys and Subscribers
  useEffect(() => {
    if (isOpen) {
      const envKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || '';
      const localKey = typeof window !== 'undefined' ? localStorage.getItem('rww_resend_api_key') || '' : '';
      setApiKey(localKey || envKey);

      const localFrom = typeof window !== 'undefined' ? localStorage.getItem('rww_resend_from_address') || '' : '';
      if (localFrom) setFromAddress(localFrom);

      loadSubscribersList();
    }
  }, [isOpen]);

  const loadSubscribersList = async () => {
    setLoadingSubscribers(true);
    try {
      const list = await fetchSubscribers();
      setSubscribers(list);
    } catch (e) {
      console.warn('Subscribers fetch error:', e);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleSaveSettings = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rww_resend_api_key', apiKey.trim());
        localStorage.setItem('rww_resend_from_address', fromAddress.trim());
      }
      alert('Dispatch settings saved to browser memory.');
    } catch (e) {}
  };

  // Generate Email HTML
  const emailHtml = generateDispatchEmailHtml({
    title: title || 'Untitled Entry',
    slug: slug || 'untitled',
    kicker: customKicker,
    excerpt: customExcerpt,
    publishedAt,
    readingTime: Math.max(1, Math.ceil((contentHtml?.length || 500) / 1000)),
  });

  // Handle Test Send
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestStatus('error');
      setTestMessage('Please enter a valid recipient test email address.');
      return;
    }
    if (!apiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Please provide a valid Resend API key in Settings.');
      return;
    }

    setIsSendingTest(true);
    setTestStatus('idle');
    setTestMessage('');

    const res = await sendResendEmail({
      apiKey,
      from: fromAddress,
      to: testEmail.trim(),
      subject,
      html: emailHtml,
    });

    setIsSendingTest(false);
    if (res.success) {
      setTestStatus('success');
      setTestMessage(`Test dispatch successfully sent to ${testEmail}!`);
    } else {
      setTestStatus('error');
      setTestMessage(res.error || 'Failed to send test email. Check API key and sender.');
    }
  };

  // Handle Broadcast to All Subscribers
  const handleBroadcast = async () => {
    if (!subscribers.length) {
      alert('No subscribers currently registered to receive this dispatch.');
      return;
    }
    if (!apiKey.trim()) {
      alert('Please enter your Resend API key under Settings before broadcasting.');
      setActiveTab('settings');
      return;
    }

    const confirmSend = window.confirm(
      `Broadcast "\n${subject}\n" to all ${subscribers.length} active subscriber(s)?`
    );
    if (!confirmSend) return;

    setIsBroadcasting(true);
    setBroadcastResult(null);
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];
      setBroadcastProgress({ current: i + 1, total: subscribers.length });

      const res = await sendResendEmail({
        apiKey,
        from: fromAddress,
        to: sub.email,
        subject,
        html: emailHtml,
      });

      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    setIsBroadcasting(false);
    setBroadcastResult({
      success: sentCount > 0,
      message: `Dispatch completed: ${sentCount} sent successfully${
        failedCount > 0 ? `, ${failedCount} failed` : ''
      }.`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-serif">
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-lg shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden text-[#1C1917]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F3EFEA] border-b border-[#DDD5C7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1C1917] text-[#D4AF37] rounded flex items-center justify-center font-bold text-xs shadow-xs">
              ◆
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#1C1917] tracking-wider uppercase">
                The Dispatch • Broadcast Studio
              </h3>
              <p className="text-[11px] text-[#66615C] font-serif">
                Direct Art Deco email broadcasts for readers of Rock The Western World
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[#66615C] hover:text-[#1C1917] rounded hover:bg-[#EAE4D7] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#DDD5C7] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-3 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'compose'
                  ? 'border-[#1E40AF] text-[#1E40AF]'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Compose & Live Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`py-3 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'border-[#1E40AF] text-[#1E40AF]'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Subscribers ({subscribers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-[#1E40AF] text-[#1E40AF]'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Resend Configuration</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#78716C]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>{subscribers.length} Subscribers Active</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'compose' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-5 space-y-4 font-serif">
                <div>
                  <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                    DISPATCH SUBJECT LINE
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#B45309] mb-1">
                      KICKER
                    </label>
                    <input
                      type="text"
                      value={customKicker}
                      onChange={(e) => setCustomKicker(e.target.value)}
                      className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                      TARGET SLUG
                    </label>
                    <div className="text-xs font-mono bg-[#F3EFEA] border border-[#DDD5C7] rounded px-3 py-2 text-[#66615C] truncate">
                      /{slug || 'untitled'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                    LEAD EXCERPT / PULLQUOTE
                  </label>
                  <textarea
                    value={customExcerpt}
                    onChange={(e) => setCustomExcerpt(e.target.value)}
                    rows={3}
                    placeholder="Enter a captivating opening paragraph or excerpt..."
                    className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
                  />
                </div>

                {/* Test Dispatch Box */}
                <div className="p-3.5 bg-[#F3EFEA] border border-[#DDD5C7] rounded space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917]">
                      SEND TEST DISPATCH
                    </span>
                    <span className="text-[10px] text-[#78716C]">Self-Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Your personal email..."
                      className="flex-1 text-xs font-serif bg-white border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
                    />
                    <button
                      type="button"
                      onClick={handleSendTest}
                      disabled={isSendingTest}
                      className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[10px] font-display uppercase tracking-wider font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {isSendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>Send Test</span>
                    </button>
                  </div>
                  {testStatus === 'success' && (
                    <div className="text-[11px] text-green-700 flex items-center gap-1 font-serif">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage}</span>
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="text-[11px] text-red-600 flex items-center gap-1 font-serif">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage}</span>
                    </div>
                  )}
                </div>

                {/* Broadcast Progress / Result Box */}
                {broadcastProgress && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1.5">
                    <div className="flex justify-between text-xs font-display font-bold text-blue-900">
                      <span>Broadcasting Dispatch...</span>
                      <span>
                        {broadcastProgress.current} / {broadcastProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E40AF] h-full transition-all duration-200"
                        style={{
                          width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {broadcastResult && (
                  <div
                    className={`p-3 rounded border text-xs flex items-center gap-2 font-serif ${
                      broadcastResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{broadcastResult.message}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Live Art Deco Email Preview */}
              <div className="lg:col-span-7 flex flex-col h-full min-h-[380px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C]">
                    RECIPIENT EMAIL PREVIEW
                  </span>
                  <span className="text-[10px] text-[#78716C] italic font-serif">
                    Responsive Broadsheet Layout
                  </span>
                </div>
                <div className="flex-1 border border-[#DDD5C7] rounded overflow-hidden bg-[#F3EFEA] relative shadow-inner min-h-[420px]">
                  <iframe
                    title="Dispatch Email Preview"
                    srcDoc={emailHtml}
                    className="w-full h-full min-h-[420px] border-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="space-y-4 font-serif">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDD5C7]">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#1C1917] uppercase tracking-wider">
                    Registered Subscribers ({subscribers.length})
                  </h4>
                  <p className="text-xs text-[#66615C]">
                    Readers who submitted their email on the public broadsheet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSubscribersList}
                  disabled={loadingSubscribers}
                  className="px-3 py-1.5 bg-[#F3EFEA] hover:bg-[#EAE4D7] border border-[#DDD5C7] text-[#1C1917] rounded text-xs font-display uppercase font-bold tracking-wider cursor-pointer"
                >
                  {loadingSubscribers ? 'Refreshing...' : '↻ Refresh List'}
                </button>
              </div>

              {subscribers.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#78716C] italic">
                  No subscribers registered yet. When visitors submit the newsletter form on the broadsheet, they will appear here.
                </div>
              ) : (
                <div className="border border-[#DDD5C7] rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F3EFEA] border-b border-[#DDD5C7] font-display font-bold uppercase tracking-wider text-[10px] text-[#66615C]">
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Subscriber Email</th>
                        <th className="py-2.5 px-4">Joined Date</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD5C7]">
                      {subscribers.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-[#FAF5ED] transition-colors">
                          <td className="py-2.5 px-4 font-mono text-stone-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono text-[#1C1917] font-medium">{sub.email}</td>
                          <td className="py-2.5 px-4 text-[#78716C]">
                            {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-display font-bold uppercase tracking-wider">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-5 font-serif py-2">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1 leading-relaxed">
                <div className="flex items-center gap-1.5 font-display font-bold uppercase tracking-wider text-amber-950">
                  <KeyRound className="w-4 h-4 text-[#B45309]" />
                  <span>Resend Email Configuration</span>
                </div>
                <p>
                  To broadcast dispatches directly to subscribers, connect your Resend API credentials. Keys saved here are stored securely in your private browser storage.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                  RESEND API KEY (re_...)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="re_123456789abcdef..."
                  className="w-full text-xs font-mono bg-[#F3EFEA] border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
                />
                <p className="text-[11px] text-[#78716C] mt-1 italic">
                  Generate an API key at{' '}
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1E40AF] underline"
                  >
                    resend.com/api-keys
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                  FROM SENDER ADDRESS
                </label>
                <input
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="Rock The Western World <dispatch@rockthewesternworld.com>"
                  className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
                />
                <p className="text-[11px] text-[#78716C] mt-1 italic">
                  Default testing domain is <span className="font-mono">onboarding@resend.dev</span>. Once verified with your DNS, use <span className="font-mono">dispatch@rockthewesternworld.com</span>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase font-bold tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  Save Dispatch Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F3EFEA] border-t border-[#DDD5C7] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#78716C] font-serif">
            {activeTab === 'compose' && (
              <span>
                Broadcasting to <strong className="text-[#1C1917]">{subscribers.length}</strong> active reader(s).
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-display uppercase tracking-widest text-[#66615C] hover:text-[#1C1917] cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'compose' && (
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={isBroadcasting || subscribers.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-xs font-display font-bold uppercase tracking-widest shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Dispatch to All ({subscribers.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
